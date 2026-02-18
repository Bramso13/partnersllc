"use client";

import { useState } from "react";
import type { DocumentWithDetails } from "@/lib/documents-types";
import { useApi } from "@/lib/api/useApi";
import { StatusBadge } from "./StatusBadge";
import { formatFileSize } from "@/lib/utils";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { toast } from "sonner";

type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc" | "status_asc" | "status_desc";

const downloadUrl = (dossierId: string, documentId: string) =>
  `/api/dossiers/${dossierId}/documents/${documentId}/download`;

interface DocumentsTableProps {
  documents: DocumentWithDetails[];
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function DocumentsTable({
  documents,
  sort,
  onSortChange,
}: DocumentsTableProps) {
  const api = useApi();
  const [previewDocument, setPreviewDocument] =
    useState<DocumentWithDetails | null>(null);

  const handleDownload = async (doc: DocumentWithDetails) => {
    try {
      const blob = await api.getBlob(downloadUrl(doc.dossier_id, doc.id));
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download =
        doc.current_version?.file_name || `document-${doc.id}.pdf`;
      a.style.display = "none";
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Téléchargement démarré");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du téléchargement"
      );
    }
  };

  const getFileTypeIcon = (mimeType: string | null | undefined) => {
    if (!mimeType) return { icon: "fa-file", color: "text-brand-text-secondary" };

    if (mimeType === "application/pdf") {
      return { icon: "fa-file-pdf", color: "text-brand-danger" };
    }
    if (mimeType.startsWith("image/")) {
      return { icon: "fa-file-image", color: "text-brand-accent" };
    }
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return { icon: "fa-file-word", color: "text-blue-500" };
    }

    return { icon: "fa-file", color: "text-brand-text-secondary" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSort = (column: string) => {
    let newSort: SortOption;

    if (column === "date") {
      newSort = sort === "date_desc" ? "date_asc" : "date_desc";
    } else if (column === "name") {
      newSort = sort === "name_asc" ? "name_desc" : "name_asc";
    } else if (column === "status") {
      newSort = sort === "status_asc" ? "status_desc" : "status_asc";
    } else {
      return;
    }

    onSortChange(newSort);
  };

  const getSortIcon = (column: string) => {
    if (column === "date" && sort.startsWith("date_")) {
      return sort === "date_desc" ? "fa-sort-down" : "fa-sort-up";
    }
    if (column === "name" && sort.startsWith("name_")) {
      return sort === "name_asc" ? "fa-sort-up" : "fa-sort-down";
    }
    if (column === "status" && sort.startsWith("status_")) {
      return sort === "status_asc" ? "fa-sort-up" : "fa-sort-down";
    }
    return "fa-sort";
  };

  return (
    <div className="bg-brand-dark-bg border border-brand-dark-border rounded-2xl p-2">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-dark-border">
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-text-primary transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  <span>Nom du document</span>
                  <i className={`fa-solid ${getSortIcon("name")} text-xs`}></i>
                </div>
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-text-primary transition-colors"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-2">
                  <span>Date d&apos;ajout</span>
                  <i className={`fa-solid ${getSortIcon("date")} text-xs`}></i>
                </div>
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-text-primary transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  <span>Statut</span>
                  <i
                    className={`fa-solid ${getSortIcon("status")} text-xs`}
                  ></i>
                </div>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => {
              const fileIcon = getFileTypeIcon(
                document.current_version?.mime_type
              );
              const category = document.document_type
                ? document.document_type.label
                : "Autre";
              const fileSize = document.current_version?.file_size_bytes
                ? formatFileSize(document.current_version.file_size_bytes)
                : "";

              return (
            <tr
              key={document.id}
              className="border-b border-brand-dark-border hover:bg-brand-dark-surface/50 transition-colors"
            >
                  <td
                    className="px-4 py-4 cursor-pointer"
                    onClick={() => setPreviewDocument(document)}
                  >
                    <div className="flex items-center gap-3">
                      <i
                        className={`fa-solid ${fileIcon.icon} ${fileIcon.color} text-xl`}
                      />
                      <div>
                        <div className="font-medium text-brand-text-primary hover:text-brand-accent transition-colors">
                          {document.current_version?.file_name ||
                            "Document sans nom"}
                        </div>
                        <div className="text-xs text-brand-text-secondary mt-0.5">
                          {category} {fileSize && `• ${fileSize}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-brand-text-primary">
                    {formatDate(document.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={document.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDocument(document);
                        }}
                        className="w-9 h-9 flex items-center justify-center bg-brand-dark-surface hover:bg-brand-dark-border rounded transition-colors"
                        aria-label="Voir le document"
                      >
                        <i className="fa-solid fa-eye text-brand-text-secondary"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(document);
                        }}
                        disabled={!document.current_version?.file_url}
                        className="w-9 h-9 flex items-center justify-center bg-brand-dark-surface hover:bg-brand-dark-border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Télécharger le document"
                      >
                        <i className="fa-solid fa-download text-brand-text-secondary"></i>
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-9 h-9 flex items-center justify-center bg-brand-dark-surface hover:bg-brand-dark-border rounded transition-colors"
                        aria-label="Plus d&apos;options"
                      >
                        <i className="fa-solid fa-ellipsis-vertical text-brand-text-secondary"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}
