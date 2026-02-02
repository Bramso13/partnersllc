"use client";

import { useState } from "react";
import { StepDocument } from "./StepValidationSection";
import { toast } from "sonner";

const SIMPLIFIED_VALIDATION = true;

interface DocumentValidationItemProps {
  document: StepDocument;
  dossierId: string;
  onRefresh: () => void;
}

const statusStyles: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  APPROVED: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    label: "Approuvé",
  },
  PENDING: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    label: "En attente",
  },
  REJECTED: { bg: "bg-red-500/20", text: "text-red-400", label: "Rejeté" },
  OUTDATED: { bg: "bg-[#363636]", text: "text-[#b7b7b7]", label: "Obsolète" },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  const mb = kb / 1024;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
}

export function DocumentValidationItem({
  document,
  dossierId,
  onRefresh,
}: DocumentValidationItemProps) {
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const status = statusStyles[document.status] ?? statusStyles.PENDING;

  const handleApprove = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/dossiers/${dossierId}/documents/${document.id}/approve`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur approbation");
      }
      toast.success("Document approuvé");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectionReason.trim().length < 10) {
      toast.error("Raison du rejet : au moins 10 caractères");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/dossiers/${dossierId}/documents/${document.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejection_reason: rejectionReason }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur rejet");
      }
      toast.success("Document rejeté");
      setShowReject(false);
      setRejectionReason("");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    if (!document.current_version) {
      toast.error("Aucune version disponible");
      return;
    }
    setShowPreview(true);
    setPreviewLoading(true);
    try {
      const res = await fetch(
        `/api/admin/dossiers/${dossierId}/documents/${document.id}/view`
      );
      if (!res.ok) throw new Error("Erreur chargement");
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setShowPreview(false);
  };

  return (
    <>
      <div className="rounded-lg bg-[#1e1f22] border border-[#363636] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[#f9f9f9]">
                {document.document_type_label}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.text}`}
              >
                {status.label}
              </span>
            </div>
            {document.current_version ? (
              <div className="text-xs text-[#b7b7b7] space-y-0.5">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-file text-[#50b989]" />
                  <span className="font-mono truncate">
                    {document.current_version.file_name ?? "Sans nom"}
                  </span>
                  <span className="text-[10px] shrink-0">
                    ({formatFileSize(document.current_version.file_size_bytes)})
                  </span>
                </div>
                <p className="text-[10px]">
                  Uploadé le{" "}
                  {new Date(
                    document.current_version.uploaded_at
                  ).toLocaleString("fr-FR")}
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <i className="fa-solid fa-exclamation-triangle" />
                Aucune version disponible
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {document.current_version && (
              <button
                type="button"
                onClick={handleView}
                className="px-2.5 py-1.5 rounded bg-[#50b989]/20 text-[#50b989] text-xs font-medium hover:bg-[#50b989]/30 transition-colors"
                title="Voir"
              >
                <i className="fa-solid fa-eye" />
              </button>
            )}
            {!SIMPLIFIED_VALIDATION &&
              document.status !== "APPROVED" &&
              !showReject && (
                <>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={loading}
                    className="px-2.5 py-1.5 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <i className="fa-solid fa-spinner fa-spin" />
                    ) : (
                      <>
                        <i className="fa-solid fa-check mr-1" />
                        Approuver
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReject(true)}
                    disabled={loading}
                    className="px-2.5 py-1.5 rounded bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30"
                  >
                    Rejeter
                  </button>
                </>
              )}
          </div>
        </div>
        {!SIMPLIFIED_VALIDATION && showReject && (
          <div className="mt-3 pt-3 border-t border-[#363636]">
            <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
              Raison du rejet (min. 10 caractères)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez le rejet…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-xs placeholder-[#b7b7b7]/60 focus:outline-none focus:ring-2 focus:ring-[#50b989] resize-none"
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-[10px] ${
                  rejectionReason.length >= 10
                    ? "text-emerald-400"
                    : "text-[#b7b7b7]"
                }`}
              >
                {rejectionReason.length}/10
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReject(false);
                    setRejectionReason("");
                  }}
                  disabled={loading}
                  className="px-2 py-1 rounded text-xs text-[#b7b7b7] hover:text-[#f9f9f9]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading || rejectionReason.trim().length < 10}
                  className="px-2 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmer rejet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rounded-xl bg-[#252628] border border-[#363636] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#363636] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-semibold text-[#f9f9f9]">
                  {document.current_version?.file_name ?? "Document"}
                </h2>
                <p className="text-xs text-[#b7b7b7] mt-0.5">
                  {document.document_type_label}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="text-[#b7b7b7] hover:text-[#f9f9f9] p-2 transition-colors"
                aria-label="Fermer"
              >
                <i className="fa-solid fa-times text-lg" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[400px]">
              {previewLoading ? (
                <div className="text-center">
                  <i className="fa-solid fa-spinner fa-spin text-3xl text-[#b7b7b7] mb-3" />
                  <p className="text-sm text-[#b7b7b7]">Chargement…</p>
                </div>
              ) : previewUrl ? (
                <>
                  {document.current_version?.mime_type?.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={document.current_version?.file_name ?? "Document"}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />
                  ) : document.current_version?.mime_type ===
                    "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      className="w-full min-h-[600px] rounded-lg border border-[#363636]"
                      title={document.current_version?.file_name ?? "PDF"}
                    />
                  ) : (
                    <div className="text-center">
                      <i className="fa-solid fa-file text-4xl text-[#b7b7b7] mb-3" />
                      <p className="text-sm text-[#f9f9f9] mb-3">
                        Aperçu non disponible
                      </p>
                      <a
                        href={previewUrl}
                        download={document.current_version?.file_name}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#50b989] text-[#191a1d] text-sm font-medium hover:bg-[#50b989]/90"
                      >
                        <i className="fa-solid fa-download" />
                        Télécharger
                      </a>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
