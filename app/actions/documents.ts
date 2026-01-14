"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDocumentRecord(
  dossierId: string,
  documentTypeId: string,
  stepInstanceId: string | null,
  filePath: string,
  fileSize: number,
  mimeType: string,
  fileName: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get document type code for reference
  const { data: docType } = await supabase
    .from("document_types")
    .select("code")
    .eq("id", documentTypeId)
    .single();

  if (!docType) {
    throw new Error("Document type not found");
  }

  // Create documents record
  const { data: document, error: docError } = await supabase
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
    throw docError;
  }

  // Create document_versions record
  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .insert({
      document_id: document.id,
      file_url: filePath,
      file_name: fileName,
      file_size_bytes: fileSize,
      mime_type: mimeType,
      uploaded_by_type: "USER",
      uploaded_by_id: user.id,
      version_number: 1,
    })
    .select()
    .single();

  if (versionError) {
    throw versionError;
  }

  // Update documents.current_version_id
  const { error: updateError } = await supabase
    .from("documents")
    .update({ current_version_id: version.id })
    .eq("id", document.id);

  if (updateError) {
    throw updateError;
  }

  // Trigger event (create event record)
  const { error: eventError } = await supabase.from("events").insert({
    entity_type: "document",
    entity_id: document.id,
    event_type: "DOCUMENT_UPLOADED",
    actor_type: "USER",
    actor_id: user.id,
    payload: {
      document_id: document.id,
      document_type_id: documentTypeId,
      dossier_id: dossierId,
      version_number: 1,
    },
  });

  if (eventError) {
    // Log error but don't fail the upload
    console.error("Error creating event:", eventError);
  }

  revalidatePath("/dashboard/documents");

  return { success: true, document_id: document.id };
}
