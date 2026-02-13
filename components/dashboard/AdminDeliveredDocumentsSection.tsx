"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/api/useApi";
import { DocumentInfoPanel } from "@/components/ui/DocumentInfoPanel";
import { DocumentInfoButton } from "@/components/ui/DocumentInfoButton";

interface AdminDeliveredDocument {
  id: string;
  document_type_id: string;
  created_at: string;
  current_version: {
    id: string;
    file_name: string;
    file_size_bytes: number;
    uploaded_at: string;
    mime_type: string;
  };
  document_type?: {
    label: string;
    description: string | null;
  };
}

interface AdminDeliveredDocumentsSectionProps {
  dossierId: string;
}

export function AdminDeliveredDocumentsSection({
  dossierId,
}: AdminDeliveredDocumentsSectionProps) {
  const api = useApi();
  const [documents, setDocuments] = useState<AdminDeliveredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<{ documents?: AdminDeliveredDocument[] }>(
          `/api/dossiers/${dossierId}/admin-delivered-documents`
        );
        setDocuments(data?.documents || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [dossierId]);

  const handleDownload = (documentId: string) => {
    window.open(
      `/api/dossiers/${dossierId}/documents/${documentId}/download`,
      "_blank"
    );
  };

  const handleView = (documentId: string) => {
    // Open in new tab for viewing
    window.open(
      `/api/dossiers/${dossierId}/documents/${documentId}/download`,
      "_blank"
    );
  };

  const openDocumentInfo = (documentId: string) => {
    setActiveDocumentId(documentId);
  };

  const closeDocumentInfo = () => {
    setActiveDocumentId(null);
  };

  const activeDocument = documents.find((doc) => doc.id === activeDocumentId);

  if (loading) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return null; // Don't show section if no documents
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Documents reçus
          </h2>
          <p className="text-sm text-brand-text-secondary mt-1">
            Documents envoyés par votre conseiller
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 bg-brand-dark-bg rounded-lg border border-brand-border hover:border-brand-accent/50 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file text-brand-primary text-xl"></i>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-brand-text-primary truncate">
                    {doc.current_version?.file_name ||
                      doc.document_type?.label ||
                      "Document"}
                  </p>
                  <DocumentInfoButton
                    onClick={() => openDocumentInfo(doc.id)}
                    hasDescription={!!doc.document_type?.description}
                  />
                </div>
                <div className="flex items-center gap-4 mt-1">
                  {doc.current_version?.uploaded_at && (
                    <p className="text-xs text-brand-text-secondary">
                      Reçu le:{" "}
                      {new Date(
                        doc.current_version.uploaded_at
                      ).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {doc.current_version?.file_size_bytes && (
                    <p className="text-xs text-brand-text-secondary">
                      {(
                        doc.current_version.file_size_bytes /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleView(doc.id)}
                className="px-3 py-1.5 text-sm bg-brand-dark-surface text-brand-text-primary rounded hover:bg-brand-dark-surface/80 transition-colors"
                title="Voir"
              >
                <i className="fas fa-eye mr-1"></i>
                Voir
              </button>
              <button
                onClick={() => handleDownload(doc.id)}
                className="px-3 py-1.5 text-sm bg-brand-accent text-white rounded hover:bg-brand-accent/90 transition-colors"
                title="Télécharger"
              >
                <i className="fas fa-download mr-1"></i>
                Télécharger
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Panel */}
      {activeDocument?.document_type?.description && (
        <DocumentInfoPanel
          description={activeDocument.document_type.description}
          isOpen={activeDocumentId !== null}
          onClose={closeDocumentInfo}
          documentName={
            activeDocument.current_version?.file_name ||
            activeDocument.document_type?.label ||
            "Document"
          }
        />
      )}
    </div>
  );
}
