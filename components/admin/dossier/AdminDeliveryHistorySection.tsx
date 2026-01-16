"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
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
  document_type?: {
    label: string;
  };
  step_instance?: {
    id: string;
    step?: {
      label: string;
    };
  };
  agent?: {
    name: string;
    email: string;
  };
}

interface AdminDeliveryHistorySectionProps {
  dossierId: string;
}

export function AdminDeliveryHistorySection({
  dossierId,
}: AdminDeliveryHistorySectionProps) {
  const [documents, setDocuments] = useState<AdminDeliveredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      fetchDeliveryHistory();
    }
  }, [dossierId, isExpanded]);

  const fetchDeliveryHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/delivery-history`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement de l'historique de livraison");
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Error fetching delivery history:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface-light border border-brand-stroke rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-brand-text-primary">
          Historique de livraison de documents
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <i
            className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"}`}
          ></i>
        </button>
      </div>

      {isExpanded && (
        <div>
          {loading ? (
            <p className="text-brand-text-secondary">
              Chargement de l'historique...
            </p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : documents.length === 0 ? (
            <p className="text-brand-text-secondary">
              Aucun document livré pour ce dossier
            </p>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <AdminDeliveryItem key={doc.id} document={doc} dossierId={dossierId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminDeliveryItem({
  document,
  dossierId,
}: {
  document: AdminDeliveredDocument;
  dossierId: string;
}) {
  const isStepRelated = !!document.step_instance_id;
  const stepName = document.step_instance?.step?.label;

  return (
    <div className="p-4 bg-brand-dark-bg border border-brand-stroke rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-brand-text-primary font-medium">
              {document.current_version?.file_name ||
                document.document_type?.label ||
                "Document"}
            </h3>
            {isStepRelated && (
              <span className="px-2 py-0.5 bg-brand-warning/20 text-brand-warning rounded text-xs font-medium">
                Étape: {stepName || "Admin"}
              </span>
            )}
            {!isStepRelated && (
              <span className="px-2 py-0.5 bg-brand-info/20 text-brand-info rounded text-xs font-medium">
                Livraison manuelle
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-brand-text-secondary">
              Envoyé{" "}
              {formatDistanceToNow(new Date(document.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
            {document.agent && (
              <p className="text-xs text-brand-text-secondary">
                Par: {document.agent.name} ({document.agent.email})
              </p>
            )}
            {document.current_version?.file_size_bytes && (
              <p className="text-xs text-brand-text-secondary">
                Taille:{" "}
                {(document.current_version.file_size_bytes / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>
        <a
          href={`/api/admin/dossiers/${dossierId}/documents/${document.id}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-primary hover:text-brand-primary/80 text-sm transition-colors ml-4"
        >
          <i className="fa-solid fa-external-link mr-1"></i>
          Voir
        </a>
      </div>
    </div>
  );
}
