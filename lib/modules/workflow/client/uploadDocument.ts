import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface UploadDocumentResult {
  document_id: string;
  version_id: string;
  file_url: string;
}

export async function uploadDocument(
  userId: string,
  file: File,
  dossierId: string,
  documentTypeId: string,
  stepInstanceId: string | null
): Promise<UploadDocumentResult> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("id")
    .eq("id", dossierId)
    .eq("user_id", userId)
    .single();

  if (dossierError || !dossier) {
    throw new Error("Dossier not found or access denied");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${dossierId}/${documentTypeId}/${Date.now()}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("dossier-documents")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error("Failed to upload file");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("dossier-documents").getPublicUrl(fileName);

  let existingDocQuery = supabase
    .from("documents")
    .select("id")
    .eq("dossier_id", dossierId)
    .eq("document_type_id", documentTypeId);

  if (stepInstanceId) {
    existingDocQuery = existingDocQuery.eq("step_instance_id", stepInstanceId);
  } else {
    existingDocQuery = existingDocQuery.is("step_instance_id", null);
  }

  const { data: existingDoc } = await existingDocQuery.maybeSingle();

  let documentId: string;

  if (existingDoc) {
    documentId = existingDoc.id;

    const { data: versions } = await supabase
      .from("document_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion =
      versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    const { data: newVersion, error: versionError } = await supabase
      .from("document_versions")
      .insert({
        document_id: documentId,
        file_url: publicUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        uploaded_by_type: "USER",
        uploaded_by_id: userId,
        version_number: nextVersion,
      })
      .select()
      .single();

    if (versionError) {
      throw new Error("Failed to create document version");
    }

    const { data: docCheck } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .single();

    if (!docCheck) {
      throw new Error("Document not found");
    }

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
      throw new Error("Failed to update document");
    }

    return {
      document_id: documentId,
      version_id: newVersion.id,
      file_url: publicUrl,
    };
  } else {
    const { data: newDoc, error: docError } = await supabase
      .from("documents")
      .insert({
        dossier_id: dossierId,
        document_type_id: documentTypeId,
        step_instance_id: stepInstanceId,
        status: "PENDING",
      })
      .select()
      .single();

    if (docError) {
      throw new Error("Failed to create document");
    }

    documentId = newDoc.id;

    const { data: firstVersion, error: versionError } = await supabase
      .from("document_versions")
      .insert({
        document_id: documentId,
        file_url: publicUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        uploaded_by_type: "USER",
        uploaded_by_id: userId,
        version_number: 1,
      })
      .select()
      .single();

    if (versionError) {
      await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);
      throw new Error("Failed to create document version");
    }

    const { data: updateData, error: updateError } = await adminClient
      .from("documents")
      .update({
        current_version_id: firstVersion.id,
      })
      .eq("id", documentId)
      .select("id, current_version_id, step_instance_id")
      .single();

    if (updateError) {
      throw new Error("Failed to update document with version");
    }

    return {
      document_id: documentId,
      version_id: firstVersion.id,
      file_url: publicUrl,
    };
  }
}
