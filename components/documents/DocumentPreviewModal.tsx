"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DocumentWithDetails } from "@/lib/documents-types";
import { useApi } from "@/lib/api/useApi";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { toast } from "sonner";

interface DocumentPreviewModalProps {
  document: DocumentWithDetails;
  onClose: () => void;
}

const downloadUrl = (dossierId: string, documentId: string) =>
  `/api/dossiers/${dossierId}/documents/${documentId}/download`;

export function DocumentPreviewModal({
  document,
  onClose,
}: DocumentPreviewModalProps) {
  const api = useApi();
  const apiRef = useRef(api);
  apiRef.current = api;
  const objectUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dossierId = document.dossier_id;
    const documentId = document.id;

    if (!document.current_version?.file_url) {
      setError("Aucun fichier disponible pour ce document");
      setLoading(false);
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    setError(null);
    setLoading(true);
    setPreviewUrl(null);

    const url = downloadUrl(dossierId, documentId);
    apiRef.current
      .getBlob(url)
      .then((blob) => {
        if (cancelled || blob.size === 0) {
          if (blob.size === 0 && !cancelled) {
            setError("Le document est vide");
            toast.error("Le document est vide");
          }
          return;
        }
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Erreur lors du chargement de l'aperçu";
          setError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [document.dossier_id, document.id, document.current_version?.file_url]);

  const handleClose = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    onClose();
  }, [onClose]);

  const [downloading, setDownloading] = useState(false);
  const handleDownload = useCallback(async () => {
    const fileName =
      document.current_version?.file_name ||
      `document-${document.id}.pdf`;
    try {
      setDownloading(true);
      const blob = await apiRef.current.getBlob(
        downloadUrl(document.dossier_id, document.id)
      );
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.style.display = "none";
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Téléchargement démarré");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors du téléchargement"
      );
    } finally {
      setDownloading(false);
    }
  }, [document.dossier_id, document.id, document.current_version?.file_name]);

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
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={loading || !!error || downloading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-sm font-medium"
              aria-label="Télécharger le document"
            >
              {downloading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-download"></i>
              )}
              <span>Télécharger</span>
            </button>
            <button
              onClick={handleClose}
              className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-2"
              aria-label="Fermer"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
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
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-dark-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {downloading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fa-solid fa-download"></i>
                    )}
                    <span>Télécharger</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
