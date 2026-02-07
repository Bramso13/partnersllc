"use client";

import { useState } from "react";
import { DocumentWithDetails } from "@/lib/documents";
import { toast } from "sonner";
import { DocumentInfoPanel } from "@/components/ui/DocumentInfoPanel";
import { DocumentInfoButton } from "@/components/ui/DocumentInfoButton";

interface DeliveredDocumentsProps {
  documents: DocumentWithDetails[];
}

export function DeliveredDocuments({ documents }: DeliveredDocumentsProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentWithDetails | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  const handleViewDocument = async (doc: DocumentWithDetails) => {
    try {
      setPreviewLoading(true);
      setShowPreview(true);
      setPreviewDocument(doc);

      const viewUrl = `/api/dossiers/${doc.dossier_id}/documents/${doc.id}/download`;
      
      const response = await fetch(viewUrl);
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du document");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Error viewing document:", err);
      toast.error(
        err instanceof Error ? err.message : "Erreur lors du chargement du document"
      );
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setShowPreview(false);
    setPreviewDocument(null);
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${kb.toFixed(2)} KB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const openDocumentInfo = (documentId: string) => {
    setActiveDocumentId(documentId);
  };

  const closeDocumentInfo = () => {
    setActiveDocumentId(null);
  };

  const activeDocument = documents.find((doc) => doc.id === activeDocumentId);

  if (documents.length === 0) {
    return null;
  }

  return (
    <>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <i className="fa-solid fa-file-arrow-down text-brand-success text-xl"></i>
          <h3 className="text-lg font-semibold text-brand-text-primary">
            Documents disponibles
          </h3>
          <span className="bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-full text-sm font-medium">
            {documents.length}
          </span>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <p className="text-sm text-brand-text-secondary mb-4">
            Votre conseiller a préparé des documents pour vous. Téléchargez-les ci-dessous.
          </p>

          <div className="space-y-3">
            {documents.map((doc) => {
              const documentLabel = doc.document_type?.label || "Document";
              const uploadedAt = doc.current_version?.uploaded_at;
              const productName = (doc.dossier as any)?.product?.name || "Dossier";

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-brand-dark-bg rounded-lg border border-brand-border hover:border-brand-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-brand-success/20 rounded-lg flex items-center justify-center">
                        <i className="fas fa-file-pdf text-brand-success text-xl"></i>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-brand-text-primary truncate">
                          {documentLabel}
                        </p>
                        <DocumentInfoButton
                          onClick={() => openDocumentInfo(doc.id)}
                          hasDescription={!!doc.document_type?.description}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-brand-text-secondary">
                          <i className="fas fa-folder mr-1"></i>
                          {productName}
                        </span>
                        {uploadedAt && (
                          <span className="text-xs text-brand-text-secondary">
                            <i className="fas fa-calendar mr-1"></i>
                            {formatDate(uploadedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="px-3 py-2 text-sm bg-brand-dark-surface text-brand-text-primary rounded-lg hover:bg-brand-dark-surface/80 transition-colors"
                      title="Prévisualiser"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <a
                      href={`/api/dossiers/${doc.dossier_id}/documents/${doc.id}/download`}
                      download
                      className="px-4 py-2 text-sm bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
                      title="Télécharger"
                    >
                      <i className="fas fa-download mr-2"></i>
                      Télécharger
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-dark-surface rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-dark-border">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-brand-text-primary">
                  {previewDocument?.current_version?.file_name || "Document"}
                </h2>
                <p className="text-sm text-brand-text-secondary mt-1">
                  {previewDocument?.document_type?.label || "Document"}
                </p>
              </div>
              <button
                onClick={handleClosePreview}
                className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-2"
                aria-label="Fermer"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-6">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-brand-text-secondary mb-4"></i>
                    <p className="text-brand-text-secondary">Chargement du document...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  {previewDocument?.current_version?.mime_type?.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={previewDocument?.current_version?.file_name || "Document"}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : previewDocument?.current_version?.mime_type === "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full min-h-[600px] rounded-lg border border-brand-dark-border"
                      title={previewDocument?.current_version?.file_name || "Document PDF"}
                    />
                  ) : (
                    <div className="text-center">
                      <i className="fa-solid fa-file text-6xl text-brand-text-secondary mb-4"></i>
                      <p className="text-brand-text-primary mb-4">
                        Aperçu non disponible pour ce type de fichier
                      </p>
                      <a
                        href={`/api/dossiers/${previewDocument?.dossier_id}/documents/${previewDocument?.id}/download`}
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
      )}

      {/* Info Panel */}
      {activeDocument?.document_type?.description && (
        <DocumentInfoPanel
          description={activeDocument.document_type.description}
          isOpen={activeDocumentId !== null}
          onClose={closeDocumentInfo}
          documentName={
            activeDocument.document_type?.label || "Document"
          }
        />
      )}
    </>
  );
}
