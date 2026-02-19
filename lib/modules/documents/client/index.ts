import { createClient } from "@/lib/supabase/server";
import type {
  DocumentWithDetails,
  DocumentVersion,
} from "@/lib/documents-types";

export async function getAll(): Promise<DocumentWithDetails[]> {
  const supabase = await createClient();

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select(
      `
      *,
      document_type:document_types(*),
      current_version:document_versions!fk_current_version(*),
      dossier:dossiers(
        id,
        product:products(name)
      )
    `
    )
    .order("created_at", { ascending: false });

  if (documentsError) {
    console.error("Error fetching documents:", documentsError);
    throw documentsError;
  }

  if (!documents || documents.length === 0) {
    return [];
  }

  return documents as DocumentWithDetails[];
}

export async function getById(documentId: string): Promise<DocumentWithDetails | null> {
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      document_type:document_types(*),
      current_version:document_versions!fk_current_version(*),
      dossier:dossiers(
        id,
        product:products(name)
      )
    `
    )
    .eq("id", documentId)
    .single();

  if (error) {
    console.error("Error fetching document:", error);
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return document as DocumentWithDetails | null;
}

export async function getVersions(documentId: string): Promise<DocumentVersion[]> {
  const supabase = await createClient();

  const { data: versions, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });

  if (error) {
    console.error("Error fetching document versions:", error);
    throw error;
  }

  return (versions || []) as DocumentVersion[];
}

export async function getDelivered(): Promise<DocumentWithDetails[]> {
  const supabase = await createClient();

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select(
      `
      *,
      document_type:document_types(*),
      current_version:document_versions!fk_current_version(*),
      dossier:dossiers(
        id,
        product:products(name)
      ),
      step_instance:step_instances(
        id,
        step:steps(label, step_type)
      )
    `
    )
    .eq("status", "DELIVERED")
    .order("created_at", { ascending: false });

  if (documentsError) {
    console.error("Error fetching delivered documents:", documentsError);
    throw documentsError;
  }

  if (!documents || documents.length === 0) {
    return [];
  }

  const deliveredDocs = documents.filter((doc: Record<string, unknown>) => {
    return doc.current_version && typeof doc.current_version === 'object' && 
      (doc.current_version as Record<string, unknown>)?.uploaded_by_type === "AGENT";
  });

  return deliveredDocs as DocumentWithDetails[];
}
