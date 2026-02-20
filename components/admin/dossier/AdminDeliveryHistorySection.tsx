"use client";

import { useCallback, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useApi } from "@/lib/api/useApi";
import { fr } from "date-fns/locale";

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
  document,
  dossierId,
}: {
  document: AdminDeliveredDocument;
  dossierId: string;
}) {
  const isStepRelated = !!document.step_instance_id;
  const stepName = document.step_instance?.step?.label;
  const label =
    document.current_version?.file_name ??
    document.document_type?.label ??
    "Document";

  return (
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
            {formatDistanceToNow(new Date(document.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </p>
          {document.agent && (
            <p className="text-[10px] text-[#b7b7b7] mt-0.5">
              Par {document.agent.name}
            </p>
          )}
          {document.current_version?.file_size_bytes != null && (
            <p className="text-[10px] text-[#b7b7b7]">
              {(document.current_version.file_size_bytes / 1024 / 1024).toFixed(
                2
              )}{" "}
              MB
            </p>
          )}
        </div>
        <a
          href={`/api/admin/dossiers/${dossierId}/documents/${document.id}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#50b989] hover:underline shrink-0"
        >
          <i className="fa-solid fa-external-link mr-1" />
          Voir
        </a>
      </div>
    </li>
  );
}
