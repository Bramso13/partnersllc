import * as client from "@/lib/modules/documents/client";

export type {
  DocumentType,
} from "@/types/dossiers";

export async function getUserDocuments() {
  return client.getAll();
}

export async function getDocumentById(documentId: string) {
  return client.getById(documentId);
}

export async function getDocumentVersions(documentId: string) {
  return client.getVersions(documentId);
}

export async function getDeliveredDocuments() {
  return client.getDelivered();
}
