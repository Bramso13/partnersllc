"use client";

import { useState } from "react";
import { StepDocument } from "./StepValidationSection";
import { toast } from "sonner";

// TODO: Feature flag pour simplification - garder pour réactivation future
const SIMPLIFIED_VALIDATION = true;

interface DocumentValidationItemProps {
  document: StepDocument;
  dossierId: string;
  onRefresh: () => void;
}

export function DocumentValidationItem({
  document,
  dossierId,
  onRefresh,
}: DocumentValidationItemProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/documents/${document.id}/approve`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'approbation");
      }

      toast.success("Document approuvé");
      onRefresh();
    } catch (err) {
      console.error("Error approving document:", err);
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'approbation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectionReason.trim().length < 10) {
      toast.error("La raison du rejet doit contenir au moins 10 caractères");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/documents/${document.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejection_reason: rejectionReason }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du rejet");
      }

      toast.success("Document rejeté");
      setShowRejectInput(false);
      setRejectionReason("");
      onRefresh();
    } catch (err) {
      console.error("Error rejecting document:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors du rejet");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> =
      {
        APPROVED: {
          bg: "bg-green-500/20",
          text: "text-green-400",
          label: "Approuvé",
        },
        PENDING: {
          bg: "bg-yellow-500/20",
          text: "text-yellow-400",
          label: "En attente",
        },
        REJECTED: {
          bg: "bg-red-500/20",
          text: "text-red-400",
          label: "Rejeté",
        },
        OUTDATED: {
          bg: "bg-gray-500/20",
          text: "text-gray-400",
          label: "Obsolète",
        },
      };

    const badge = badges[status] || badges.PENDING;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${kb.toFixed(2)} KB`;
  };

  const handleView = async () => {
    if (!document.current_version) {
      toast.error("Aucune version disponible pour ce document");
      return;
    }

    try {
      setPreviewLoading(true);
      setShowPreview(true);

      // Construire l'URL de l'API pour récupérer le document
      const viewUrl = `/api/admin/dossiers/${dossierId}/documents/${document.id}/view`;
      
      // Créer un blob URL depuis la réponse de l'API
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
  };

  return (
    <div className="border border-brand-stroke rounded-lg p-4 bg-brand-dark-bg/30">
      <div className="flex items-start justify-between gap-4">
        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-brand-text-primary">
              {document.document_type_label}
            </span>
            {getStatusBadge(document.status)}
          </div>

          {document.current_version && (
            <div className="text-sm text-brand-text-secondary space-y-1">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-file text-brand-accent"></i>
                <span className="font-mono">
                  {document.current_version.file_name || "Sans nom"}
                </span>
                <span className="text-xs">
                  ({formatFileSize(document.current_version.file_size_bytes)})
                </span>
              </div>
              <div className="text-xs">
                Uploadé le{" "}
                {new Date(
                  document.current_version.uploaded_at
                ).toLocaleDateString("fr-FR")}{" "}
                à{" "}
                {new Date(
                  document.current_version.uploaded_at
                ).toLocaleTimeString("fr-FR")}
              </div>
            </div>
          )}

          {!document.current_version && (
            <div className="text-sm text-brand-text-secondary">
              <i className="fa-solid fa-exclamation-triangle text-yellow-400 mr-2"></i>
              Aucune version disponible
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {document.current_version && (
            <button
              onClick={handleView}
              className="px-3 py-1.5 rounded bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent text-sm font-medium transition-colors"
              title="Visionner"
            >
              <i className="fa-solid fa-eye"></i>
            </button>
          )}

          {/* TODO: Masqué pour simplification - garder pour réactivation future */}
          {!SIMPLIFIED_VALIDATION && document.status !== "APPROVED" && !showRejectInput && (
            <>
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="px-3 py-1.5 rounded bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-1"></i>
                    Approuver
                  </>
                )}
              </button>

              <button
                onClick={() => setShowRejectInput(true)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-times mr-1"></i>
                Rejeter
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reject Input */}
      {/* TODO: Masqué pour simplification - garder pour réactivation future */}
      {!SIMPLIFIED_VALIDATION && showRejectInput && (
        <div className="mt-4 pt-4 border-t border-brand-stroke">
          <label className="block text-sm font-medium text-brand-text-primary mb-2">
            Raison du rejet (minimum 10 caractères)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Expliquez pourquoi ce document est rejeté..."
            className="w-full px-3 py-2 bg-brand-dark-surface border border-brand-stroke rounded-lg text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
            rows={3}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-xs ${
                rejectionReason.length >= 10
                  ? "text-green-400"
                  : "text-brand-text-secondary"
              }`}
            >
              {rejectionReason.length} / 10 caractères minimum
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectionReason("");
                }}
                disabled={isLoading}
                className="px-3 py-1.5 rounded text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading || rejectionReason.trim().length < 10}
                className="px-3 py-1.5 rounded bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                    Rejet en cours...
                  </>
                ) : (
                  "Confirmer le rejet"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-dark-surface rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-dark-border">
              <div>
                <h2 className="text-xl font-bold text-brand-text-primary">
                  {document.current_version?.file_name || "Document"}
                </h2>
                <p className="text-sm text-brand-text-secondary mt-1">
                  {document.document_type_label}
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
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-brand-text-secondary mb-4"></i>
                    <p className="text-brand-text-secondary">Chargement...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="flex items-center justify-center h-full">
                  {document.current_version?.mime_type?.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={document.current_version?.file_name || "Document"}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : document.current_version?.mime_type === "application/pdf" ? (
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
      )}
    </div>
  );
}
