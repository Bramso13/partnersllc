import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const dossierId = formData.get("dossier_id") as string;
    const documentTypeId = formData.get("document_type_id") as string;
    const stepInstanceIdRaw = formData.get("step_instance_id") as string | null;
    // Convert empty string to null, keep valid strings
    const stepInstanceId = stepInstanceIdRaw && stepInstanceIdRaw.trim() !== "" 
      ? stepInstanceIdRaw 
      : null;

    console.log("[UPLOAD DOCUMENT] Props:", {
      file,
      dossierId,
      documentTypeId,
      stepInstanceId,
      stepInstanceIdRaw,
    });

    if (!file || !dossierId || !documentTypeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify dossier belongs to user
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("id")
      .eq("id", dossierId)
      .eq("user_id", user.id)
      .single();

    if (dossierError || !dossier) {
      return NextResponse.json(
        { error: "Dossier not found or access denied" },
        { status: 404 }
      );
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${dossierId}/${documentTypeId}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("dossier-documents")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("dossier-documents").getPublicUrl(fileName);

    // Check if document already exists for this type, dossier, and step_instance
    let existingDocQuery = supabase
      .from("documents")
      .select("id")
      .eq("dossier_id", dossierId)
      .eq("document_type_id", documentTypeId);
    
    // Include step_instance_id in the check if provided
    if (stepInstanceId) {
      existingDocQuery = existingDocQuery.eq("step_instance_id", stepInstanceId);
    } else {
      // If no step_instance_id provided, check for documents with null step_instance_id
      existingDocQuery = existingDocQuery.is("step_instance_id", null);
    }
    
    const { data: existingDoc } = await existingDocQuery.maybeSingle();
    
    console.log("[UPLOAD DOCUMENT] Existing document check:", {
      dossierId,
      documentTypeId,
      stepInstanceId,
      existingDoc,
    });

    let documentId: string;

    if (existingDoc) {
      // Update existing document
      documentId = existingDoc.id;

      // Get current version number
      const { data: versions } = await supabase
        .from("document_versions")
        .select("version_number")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion =
        versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      // Create new version
      const { data: newVersion, error: versionError } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentId,
          file_url: publicUrl,
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
          uploaded_by_type: "USER",
          uploaded_by_id: user.id,
          version_number: nextVersion,
        })
        .select()
        .single();

      if (versionError) {
        console.error("Version creation error:", versionError);
        return NextResponse.json(
          { error: "Failed to create document version" },
          { status: 500 }
        );
      }

      // Verify document still exists before updating
      const { data: docCheck } = await supabase
        .from("documents")
        .select("id")
        .eq("id", documentId)
        .single();

      if (!docCheck) {
        console.error("[UPLOAD DOCUMENT] Document not found for update:", documentId);
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      // Update document's current version using admin client to bypass RLS
      const adminClient = createAdminClient();
      const { data: updateData, error: updateError } = await adminClient
        .from("documents")
        .update({
          current_version_id: newVersion.id,
          status: "PENDING",
        })
        .eq("id", documentId)
        .select("id, current_version_id, status")
        .single();

      if (updateError) {
        console.error("[UPLOAD DOCUMENT] Document update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update document" },
          { status: 500 }
        );
      }

      console.log("[UPLOAD DOCUMENT] Document updated successfully:", {
        documentId,
        current_version_id: updateData?.current_version_id,
        newVersionId: newVersion.id,
        status: updateData?.status,
        updateData,
      });
    } else {
      // Create new document first (without current_version_id, will be set after version creation)
      const { data: newDoc, error: docError } = await supabase
        .from("documents")
        .insert({
          dossier_id: dossierId,
          document_type_id: documentTypeId,
          step_instance_id: stepInstanceId,
          status: "PENDING",
          // current_version_id will be set after version creation
        })
        .select()
        .single();

      if (docError) {
        console.error("Document creation error:", docError);
        return NextResponse.json(
          { error: "Failed to create document" },
          { status: 500 }
        );
      }

      documentId = newDoc.id;

      // Create first version with document_id
      const { data: firstVersion, error: versionError } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentId,
          file_url: publicUrl,
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
          uploaded_by_type: "USER",
          uploaded_by_id: user.id,
          version_number: 1,
        })
        .select()
        .single();

      if (versionError) {
        console.error("Version creation error:", versionError);
        // Clean up the document if version creation fails
        await supabase
          .from("documents")
          .delete()
          .eq("id", documentId);
        return NextResponse.json(
          { error: "Failed to create document version" },
          { status: 500 }
        );
      }

      // Update document with current_version_id using admin client to bypass RLS
      const adminClient = createAdminClient();
      const { data: updateData, error: updateError } = await adminClient
        .from("documents")
        .update({
          current_version_id: firstVersion.id,
        })
        .eq("id", documentId)
        .select("id, current_version_id, step_instance_id")
        .single();

      if (updateError) {
        console.error("[UPLOAD DOCUMENT] Document update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update document with version" },
          { status: 500 }
        );
      }

      console.log("[UPLOAD DOCUMENT] New document created and updated:", {
        documentId,
        current_version_id: updateData?.current_version_id,
        firstVersionId: firstVersion.id,
        step_instance_id: updateData?.step_instance_id,
        updateData,
      });
    }

    return NextResponse.json({
      success: true,
      document_id: documentId,
      file_url: publicUrl,
    });
  } catch (error) {
    console.error("Error in upload-document:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload document",
      },
      { status: 500 }
    );
  }
}
