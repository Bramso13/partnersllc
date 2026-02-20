"use client";

import { useCallback, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useApi } from "@/lib/api/useApi";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface AdminDeliveredDocument {
  id: string;
  document_type_id: string;
  step_instance_id: string | null;
  created_at: string;
  current_version: {
    id: string;
    file_name: string;
    file_size_bytes: number;
    uploaded_at: string;
    uploaded_by_id: string;
  };
  document_type?: { label: string };
  step_instance?: {
    id: string;
    step?: { label: string };
  };
  agent?: { name: string; email: string };
}

interface AdminDeliveryHistorySectionProps {
  dossierId: string;
}

export function AdminDeliveryHistorySection({
  dossierId,
}: AdminDeliveryHistorySectionProps) {
  const api = useApi();
  const [documents, setDocuments] = useState<AdminDeliveredDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchDelivery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ documents?: AdminDeliveredDocument[] }>(
        `/api/admin/dossiers/${dossierId}/delivery-history`
      );
      setDocuments(data?.documents ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [api, dossierId]);

  useEffect(() => {
    if (!expanded) return;
    fetchDelivery();
  }, [dossierId, expanded]);

  return (
    <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
      <button
        type="button"
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#2d3033]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-base font-semibold text-[#f9f9f9]">
          Historique de livraison
        </h2>
        <i
          className={`fa-solid fa-chevron-${expanded ? "up" : "down"} text-[#b7b7b7]`}
        />
      </button>
      {expanded && (
        <div className="px-6 pb-6 border-t border-[#363636] pt-4">
          {loading ? (
            <p className="text-sm text-[#b7b7b7] flex items-center gap-2">
              <i className="fa-solid fa-spinner fa-spin" />
              Chargement…
            </p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-[#b7b7b7]">
              Aucun document livré pour ce dossier
            </p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <DeliveryItem
                  key={doc.id}
                  document={doc}
                  dossierId={dossierId}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function DeliveryItem({
  document: doc,
  dossierId,
}: {
  document: AdminDeliveredDocument;
  dossierId: string;
}) {
  const api = useApi();
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);

  const isStepRelated = !!doc.step_instance_id;
  const stepName = doc.step_instance?.step?.label;
  const label =
    doc.current_version?.file_name ??
    doc.document_type?.label ??
    "Document";
  const fileName = doc.current_version?.file_name ?? "Document";

  const handleView = async () => {
    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewUrl(null);
    setPreviewMimeType(null);
    try {
      const blob = await api.getBlob(
        `/api/admin/dossiers/${dossierId}/documents/${doc.id}/view`
      );
      setPreviewMimeType(blob.type || null);
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
    setPreviewMimeType(null);
    setShowPreview(false);
  };

  useEffect(() => {
    if (!showPreview) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [showPreview]);

  return (
    <>
      <li className="rounded-lg bg-[#1e1f22] border border-[#363636] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-[#f9f9f9] truncate">
                {label}
              </h3>
              {isStepRelated ? (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-medium">
                  Étape: {stepName ?? "Admin"}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-[#50b989]/20 text-[#50b989] text-[10px] font-medium">
                  Livraison manuelle
                </span>
              )}
            </div>
            <p className="text-xs text-[#b7b7b7]">
              Envoyé{" "}
              {formatDistanceToNow(new Date(doc.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          {doc.agent && (
            <p className="text-[10px] text-[#b7b7b7] mt-0.5">
              Par {doc.agent.name}
              </p>
            )}
          {doc.current_version?.file_size_bytes != null && (
            <p className="text-[10px] text-[#b7b7b7]">
              {(doc.current_version.file_size_bytes / 1024 / 1024).toFixed(
                  2
                )}{" "}
                MB
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleView}
            className="inline-flex items-center gap-1 text-xs text-[#50b989] hover:text-[#50b989]/90 hover:underline shrink-0 transition-colors"
          >
            <i className="fa-solid fa-eye" />
            Voir
          </button>
        </div>
      </li>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
        >
          <div className="rounded-xl bg-[#252628] border border-[#363636] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#363636] flex items-center justify-between shrink-0">
              <h2 id="preview-title" className="text-base font-semibold text-[#f9f9f9]">
                {fileName}
              </h2>
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
                  {previewMimeType?.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={fileName}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />
                  ) : previewMimeType === "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      className="w-full min-h-[600px] rounded-lg border border-[#363636]"
                      title={fileName}
                    />
                  ) : (
                    <div className="text-center">
                      <i className="fa-solid fa-file text-4xl text-[#b7b7b7] mb-3" />
                      <p className="text-sm text-[#f9f9f9] mb-3">
                        Aperçu non disponible
                      </p>
                      <a
                        href={previewUrl}
                        download={fileName}
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
