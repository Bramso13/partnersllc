import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get or create agent for user
async function getOrCreateAgent(userId: string, userName: string, userEmail: string) {
  const supabase = await createAdminClient();
  
  // Try to find existing agent by email
  const { data: agent, error } = await supabase
    .from("agents")
    .select("id")
    .eq("email", userEmail)
    .single();

  // If agent doesn't exist, create one
  if (error || !agent) {
    const { data: newAgent, error: createError } = await supabase
      .from("agents")
      .insert({
        email: userEmail,
        name: userName,
        active: true,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating agent:", createError);
      throw new Error("Impossible de créer l'agent");
    }

    return newAgent.id;
  }

  return agent.id;
}

/**
 * POST /api/admin/dossiers/[id]/send-documents
 * Admin endpoint to send documents to clients (for admin steps or manual delivery)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdminAuth();
    const { id: dossierId } = await params;
    const supabase = createAdminClient();

    // Get or create agent ID
    const agentId = await getOrCreateAgent(
      user.id,
      user.full_name || user.email || "Admin",
      user.email || ""
    );

    // Parse form data
    const formData = await request.formData();
    const stepInstanceId = formData.get("step_instance_id") as string | null;
    const message = formData.get("message") as string | null;
    const documentTypeIdsRaw = formData.getAll("document_type_ids[]");
    const documentTypeIds = documentTypeIdsRaw
      .filter((id): id is string => typeof id === "string")
      .filter((id) => id.length > 0);
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Au moins un fichier est requis" },
        { status: 400 }
      );
    }

    // Verify dossier exists
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("id, product_id, user_id")
      .eq("id", dossierId)
      .single();

    if (dossierError || !dossier) {
      return NextResponse.json(
        { error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    let stepInstance = null;
    let step = null;
    let stepCompleted = false;

    // If step_instance_id provided, verify it's an admin step
    if (stepInstanceId) {
      const { data: si, error: siError } = await supabase
        .from("step_instances")
        .select(
          `
          *,
          step:steps(*)
        `
        )
        .eq("id", stepInstanceId)
        .eq("dossier_id", dossierId)
        .single();

      if (siError || !si) {
        return NextResponse.json(
          { error: "Instance d'étape non trouvée" },
          { status: 404 }
        );
      }

      stepInstance = si;
      step = Array.isArray(si.step) ? si.step[0] : si.step;

      // Verify it's an admin step
      if (!step || step.step_type !== "ADMIN") {
        return NextResponse.json(
          { error: "Cette étape n'est pas une étape admin" },
          { status: 400 }
        );
      }

      // Check if step is already completed
      if (si.completed_at) {
        return NextResponse.json(
          { error: "Cette étape est déjà complétée" },
          { status: 400 }
        );
      }
    }

    // Upload files and create documents
    const documentIds: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

      // Determine storage path
      let storagePath: string;
      if (stepInstanceId) {
        storagePath = `${dossierId}/admin-steps/${stepInstanceId}/${timestamp}_${i}_${sanitizedFileName}`;
      } else {
        storagePath = `${dossierId}/admin-delivered/${timestamp}_${i}_${sanitizedFileName}`;
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("dossier-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        return NextResponse.json(
          { error: `Erreur lors de l'upload du fichier ${file.name}` },
          { status: 500 }
        );
      }

      // Get document type ID (use first one if multiple provided, or create a generic one)
      let documentTypeId: string;
      if (documentTypeIds.length > i && documentTypeIds[i]) {
        documentTypeId = documentTypeIds[i];
      } else if (documentTypeIds.length > 0) {
        documentTypeId = documentTypeIds[0];
      } else {
        // Create or get a generic document type for admin delivery
        const { data: genericType } = await supabase
          .from("document_types")
          .select("id")
          .eq("code", "ADMIN_DELIVERED")
          .single();

        if (genericType) {
          documentTypeId = genericType.id;
        } else {
          // Create generic document type
          const { data: newType, error: typeError } = await supabase
            .from("document_types")
            .insert({
              code: "ADMIN_DELIVERED",
              label: "Document livré par admin",
              max_file_size_mb: 10,
              allowed_extensions: ["pdf", "jpg", "png"],
            })
            .select("id")
            .single();

          if (typeError || !newType) {
            console.error("Error creating document type:", typeError);
            return NextResponse.json(
              { error: "Erreur lors de la création du type de document" },
              { status: 500 }
            );
          }
          documentTypeId = newType.id;
        }
      }

      // Create document record
      const { data: newDoc, error: docError } = await supabase
        .from("documents")
        .insert({
          dossier_id: dossierId,
          document_type_id: documentTypeId,
          step_instance_id: stepInstanceId || null,
          status: "APPROVED", // Admin-delivered documents are automatically approved
        })
        .select()
        .single();

      if (docError || !newDoc) {
        console.error("Error creating document:", docError);
        // Clean up uploaded file
        await supabase.storage
          .from("dossier-documents")
          .remove([storagePath]);
        return NextResponse.json(
          { error: "Erreur lors de la création du document" },
          { status: 500 }
        );
      }

      documentIds.push(newDoc.id);

      // Create document version
      const { data: newVersion, error: versionError } = await supabase
        .from("document_versions")
        .insert({
          document_id: newDoc.id,
          file_url: storagePath, // Store relative path
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
          uploaded_by_type: "AGENT",
          uploaded_by_id: agentId,
          version_number: 1,
        })
        .select()
        .single();

      if (versionError || !newVersion) {
        console.error("Error creating document version:", versionError);
        // Clean up document and file
        await supabase.from("documents").delete().eq("id", newDoc.id);
        await supabase.storage
          .from("dossier-documents")
          .remove([storagePath]);
        return NextResponse.json(
          { error: "Erreur lors de la création de la version du document" },
          { status: 500 }
        );
      }

      // Update document with current_version_id
      await supabase
        .from("documents")
        .update({ current_version_id: newVersion.id })
        .eq("id", newDoc.id);
    }

    // If step_instance_id provided, mark step as completed
    if (stepInstanceId && stepInstance && !stepInstance.completed_at) {
      const { error: completeError } = await supabase
        .from("step_instances")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", stepInstanceId);

      if (!completeError) {
        stepCompleted = true;

        // Create STEP_COMPLETED event
        await supabase.from("events").insert({
          entity_type: "STEP_INSTANCE",
          entity_id: stepInstanceId,
          event_type: "STEP_COMPLETED",
          actor_type: "AGENT",
          actor_id: agentId,
          payload: {
            step_id: step?.id,
            step_instance_id: stepInstanceId,
            dossier_id: dossierId,
            step_name: step?.label || "Étape admin",
            document_ids: documentIds,
            document_count: documentIds.length,
          },
        });
      }
    }

    // Create DOCUMENT_DELIVERED event
    // Note: Event-to-notification orchestration system (Story 3.9) will automatically
    // create and send notifications based on configured rules
    await supabase.from("events").insert({
      entity_type: "DOSSIER",
      entity_id: dossierId,
      event_type: "DOCUMENT_DELIVERED",
      actor_type: "AGENT",
      actor_id: agentId,
      payload: {
        dossier_id: dossierId,
        document_ids: documentIds,
        document_count: documentIds.length,
        step_instance_id: stepInstanceId || null,
        step_name: step?.label || null,
        message: message || null,
      },
    });

    // Note: Notification creation and delivery is now handled automatically
    // by the event-to-notification orchestration system (Story 3.9)
    // The DOCUMENT_DELIVERED event above will trigger notifications based on
    // configured rules in the notification_rules table

    return NextResponse.json({
      success: true,
      document_ids: documentIds,
      step_completed: stepCompleted,
      message: "Documents envoyés avec succès",
    });
  } catch (error) {
    console.error("Error in send-documents endpoint:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'envoi des documents" },
      { status: 500 }
    );
  }
}
