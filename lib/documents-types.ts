export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED" | "OUTDATED" | "DELIVERED";

export interface DocumentType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  required_step_id: string | null;
  max_file_size_mb: number | null;
  allowed_extensions: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  file_url: string;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_by_type: "USER" | "AGENT";
  uploaded_by_id: string;
  version_number: number;
  uploaded_at: string;
}

export interface Document {
  id: string;
  dossier_id: string;
  document_type_id: string;
  step_instance_id: string | null;
  status: DocumentStatus;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithDetails extends Document {
  document_type?: DocumentType | null;
  current_version?: DocumentVersion | null;
  dossier?: {
    id: string;
    product?: {
      name: string;
    } | null;
  } | null;
  step_instance?: {
    id: string;
    step?: {
      label: string;
      step_type: string;
    } | null;
  } | null;
}

/**
 * Map document type code/category to category for filtering
 * Based on document type code patterns
 */
export function getDocumentCategory(
  documentType: DocumentType | null | undefined
): "juridique" | "fiscal" | "bancaire" | "autre" {
  if (!documentType) return "autre";

  const code = documentType.code.toLowerCase();

  // Map based on code patterns or labels
  if (
    code.includes("juridique") ||
    code.includes("legal") ||
    code.includes("passport") ||
    code.includes("identity")
  ) {
    return "juridique";
  }
  if (
    code.includes("fiscal") ||
    code.includes("tax") ||
    code.includes("invoice")
  ) {
    return "fiscal";
  }
  if (
    code.includes("bancaire") ||
    code.includes("bank") ||
    code.includes("banking")
  ) {
    return "bancaire";
  }

  return "autre";
}
