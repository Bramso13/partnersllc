"use client";

import { useState, useEffect } from "react";
import type { DocumentWithDetails } from "@/lib/documents-types";
import { createClient } from "@/lib/supabase/client";
import { MarkdownContent } from "@/components/ui/MarkdownContent";

interface DocumentPreviewModalProps {
  document: DocumentWithDetails;
  onClose: () => void;
}

export function DocumentPreviewModal({
  document,
  onClose,
}: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (document.current_version?.file_url) {
      loadPreviewUrl();
    } else {
      setError("Aucun fichier disponible pour ce document");
      setLoading(false);
    }
  }, [document]);

  const loadPreviewUrl = async () => {
    try {
      setLoading(true);
      const filePath = document.current_version!.file_url;

      const { data, error: urlError } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (urlError) throw urlError;

      setPreviewUrl(data.signedUrl);
    } catch (err: any) {
      setError("Erreur lors du chargement de l'aperçu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isImage = document.current_version?.mime_type?.startsWith("image/");
  const isPdf = document.current_version?.mime_type === "application/pdf";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-dark-surface rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-dark-border">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-brand-text-primary">
              {document.current_version?.file_name || "Document"}
            </h2>
            <p className="text-sm text-brand-text-secondary mt-1">
              {document.document_type?.label || "Type inconnu"}
            </p>
            {document.document_type?.description && (
              <div className="mt-2">
                <MarkdownContent
                  content={document.document_type.description}
                  className="text-xs text-brand-text-secondary"
                />
              </div>
            )}
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
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-brand-text-secondary mb-4"></i>
                <p className="text-brand-text-secondary">Chargement...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <i className="fa-solid fa-exclamation-triangle text-4xl text-brand-danger mb-4"></i>
                <p className="text-brand-text-primary">{error}</p>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="flex items-center justify-center h-full">
              {isImage ? (
                <img
                  src={previewUrl}
                  alt={document.current_version?.file_name || "Document"}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : isPdf ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[600px] rounded-lg border border-brand-dark-border"
                  title={document.current_version?.file_name || "Document PDF"}
                />
              ) : (
                <div className="text-center">
                  <i className="fa-solid fa-file text-6xl text-brand-text-secondary mb-4"></i>
                  <p className="text-brand-text-primary mb-4">
                    Aperçu non disponible pour ce type de fichier
                  </p>
                  <a
                    href={previewUrl}
                    download={document.current_version?.file_name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-dark-bg rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <i className="fa-solid fa-download"></i>
                    <span>Télécharger</span>
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
