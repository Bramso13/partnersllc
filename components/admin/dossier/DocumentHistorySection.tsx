"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  uploaded_at: string;
  uploaded_by_id: string;
  document_type_label?: string;
  reviews: DocumentReview[];
}

interface DocumentReview {
  id: string;
  status: "APPROVED" | "REJECTED" | "PENDING";
  reason: string | null;
  reviewed_at: string;
  reviewed_by_id: string;
  reviewer_name?: string;
}

interface DocumentHistorySectionProps {
  dossierId: string;
}

export function DocumentHistorySection({
  dossierId,
}: DocumentHistorySectionProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/dossiers/${dossierId}/document-history`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement historique");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setVersions(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dossierId, expanded]);

  return (
    <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
      <button
        type="button"
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#2d3033]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-base font-semibold text-[#f9f9f9]">
          Historique des documents
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
          ) : versions.length === 0 ? (
            <p className="text-sm text-[#b7b7b7]">Aucun document</p>
          ) : (
            <ul className="space-y-3">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="rounded-lg bg-[#1e1f22] border border-[#363636] p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-medium text-[#f9f9f9]">
                        {v.document_type_label ?? "Document"}
                      </h3>
                      <p className="text-xs text-[#b7b7b7] mt-0.5">
                        Version {v.version_number} ·{" "}
                        {formatDistanceToNow(new Date(v.uploaded_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    <a
                      href={v.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#50b989] hover:underline shrink-0"
                    >
                      <i className="fa-solid fa-external-link mr-1" />
                      Voir
                    </a>
                  </div>
                  {v.reviews?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-medium text-[#b7b7b7] uppercase tracking-wider">
                        Révisions
                      </p>
                      {v.reviews.map((r) => (
                        <div
                          key={r.id}
                          className={`p-2 rounded text-xs ${
                            r.status === "APPROVED"
                              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                              : r.status === "REJECTED"
                                ? "bg-red-500/10 border border-red-500/30 text-red-400"
                                : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-medium">
                              {r.status === "APPROVED"
                                ? "Approuvé"
                                : r.status === "REJECTED"
                                  ? "Rejeté"
                                  : "En attente"}
                            </span>
                            <span className="text-[10px] opacity-80">
                              {formatDistanceToNow(new Date(r.reviewed_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </div>
                          {r.reviewer_name && (
                            <p className="text-[10px] opacity-90">
                              Par {r.reviewer_name}
                            </p>
                          )}
                          {r.reason && (
                            <p className="text-[10px] opacity-90 mt-0.5">
                              {r.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
