import { createAdminClient } from "@/lib/supabase/server";

interface DocumentVersion {
  id: string;
  file_url: string;
  file_name: string;
  file_size_bytes: number | null;
  uploaded_at: string;
  uploaded_by_type: string;
}

interface DossierDocument {
  id: string;
  document_type_id: string;
  status: string;
  step_instance_id: string | null;
  created_at: string;
  file_name: string;
  file_url: string;
  current_version: DocumentVersion | null;
}

export async function getDossierDocuments(
  userId: string,
  dossierId: string,
  stepInstanceId?: string
): Promise<DossierDocument[]> {
  const supabase = createAdminClient();

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("id")
    .eq("id", dossierId)
    .eq("user_id", userId)
    .single();

  if (dossierError || !dossier) {
    throw new Error("Dossier not found or access denied");
  }

  let query = supabase
    .from("documents")
    .select(
      `
      id,
      document_type_id,
      status,
      step_instance_id,
      created_at,
      current_version:document_versions!fk_current_version (
        id,
        file_url,
        file_name,
        file_size_bytes,
        uploaded_at,
        uploaded_by_type
      )
    `
    )
    .eq("dossier_id", dossierId);

  if (stepInstanceId) {
    query = query.eq("step_instance_id", stepInstanceId);
  }

  const { data: documents, error } = await query;

  if (error) {
    console.error("[getDossierDocuments] Error fetching documents:", error);
    throw error;
  }

  const mappedDocs = (documents || [])
    .filter((doc: any) => {
      return doc.current_version !== null && doc.current_version !== undefined;
    })
    .map((doc: any) => {
      const currentVersion = doc.current_version;
      return {
        id: doc.id,
        document_type_id: doc.document_type_id,
        status: doc.status,
        step_instance_id: doc.step_instance_id,
        created_at: doc.created_at,
        file_name: currentVersion?.file_name || "",
        file_url: currentVersion?.file_url || "",
        current_version: currentVersion
          ? {
              id: currentVersion.id,
              file_name: currentVersion.file_name,
              file_url: currentVersion.file_url,
              file_size_bytes: currentVersion.file_size_bytes,
              uploaded_at: currentVersion.uploaded_at,
              uploaded_by_type: currentVersion.uploaded_by_type,
            }
          : null,
      };
    });

  return mappedDocs as DossierDocument[];
}
