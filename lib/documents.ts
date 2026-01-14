import { createClient } from "@/lib/supabase/server";
import type {
  DocumentStatus,
  DocumentType,
  DocumentVersion,
  Document,
  DocumentWithDetails,
} from "./documents-types";

// Re-export types for convenience
export type {
  DocumentStatus,
  DocumentType,
  DocumentVersion,
  Document,
  DocumentWithDetails,
};

/**
 * Get all documents for the current authenticated user
 * RLS is enforced by Supabase
 */
export async function getUserDocuments(): Promise<DocumentWithDetails[]> {
  const supabase = await createClient();

  // Fetch documents with related data
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

/**
 * Get a single document by ID (with RLS enforcement)
 */
export async function getDocumentById(
  documentId: string
): Promise<DocumentWithDetails | null> {
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

/**
 * Get all document versions for a document
 */
export async function getDocumentVersions(
  documentId: string
): Promise<DocumentVersion[]> {
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

