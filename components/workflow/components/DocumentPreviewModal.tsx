"use client";

import type { DocumentPreviewModalProps } from "../types";

/**
 * Modal component for previewing documents (PDF and images).
 * Supports PDF iframe preview, image display, and download fallback for unsupported types.
 *
 * @param isOpen - Whether the modal is open
 * @param document - Document metadata
 * @param previewUrl - Object URL for the document blob
 * @param isLoading - Loading state while fetching document
 * @param dossierId - Dossier ID for download link
 * @param onClose - Callback to close the modal
 */
export function DocumentPreviewModal({
  isOpen,
  document,
  previewUrl,
  isLoading,
  dossierId,
  onClose,
}: DocumentPreviewModalProps) {
  if (!isOpen) return null;

  const fileName =
    document?.current_version?.file_name ||
    document?.file_name ||
    "Document";

  const mimeType =
    document?.current_version?.mime_type || document?.mime_type;

  const documentTypeLabel = document?.document_type_label || "Document";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-dark-surface rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-dark-border">
          <div>
            <h2 className="text-xl font-bold text-brand-text-primary">
              {fileName}
            </h2>
            <p className="text-sm text-brand-text-secondary mt-1">
              {documentTypeLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-2"
            aria-label="Fermer"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-brand-text-secondary mb-4"></i>
                <p className="text-brand-text-secondary">
                  Chargement du document...
                </p>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              {mimeType?.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : mimeType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[600px] rounded-lg border border-brand-dark-border"
                  title={fileName}
                />
              ) : (
                <div className="text-center">
                  <i className="fa-solid fa-file text-6xl text-brand-text-secondary mb-4"></i>
                  <p className="text-brand-text-primary mb-4">
                    Aperçu non disponible pour ce type de fichier
                  </p>
                  <a
                    href={`/api/dossiers/${dossierId}/documents/${document?.id}/download`}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-dark-bg rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <i className="fa-solid fa-download"></i>
                    <span>Télécharger le document</span>
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
