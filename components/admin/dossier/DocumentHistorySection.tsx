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
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) {
      fetchDocumentHistory();
    }
  }, [dossierId, isExpanded]);

  const fetchDocumentHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/document-history`
      );
      if (!response.ok)
        throw new Error("Erreur lors du chargement de l'historique des documents");

      const data = await response.json();
      setDocumentVersions(data);
    } catch (err) {
      console.error("Error fetching document history:", err);
      setError("Erreur lors du chargement de l'historique des documents");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface-light border border-brand-stroke rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-brand-text-primary">
          Historique des documents
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
          {isLoading ? (
            <p className="text-brand-text-secondary">
              Chargement de l'historique...
            </p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : documentVersions.length === 0 ? (
            <p className="text-brand-text-secondary">Aucun document</p>
          ) : (
            <div className="space-y-4">
              {documentVersions.map((version) => (
                <DocumentVersionItem key={version.id} version={version} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentVersionItem({ version }: { version: DocumentVersion }) {
  return (
    <div className="p-4 bg-brand-dark-bg border border-brand-stroke rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-brand-text-primary font-medium">
            {version.document_type_label || "Document"}
          </h3>
          <p className="text-xs text-brand-text-secondary mt-1">
            Version {version.version_number} •{" "}
            {formatDistanceToNow(new Date(version.uploaded_at), {
              addSuffix: true,
              locale: fr,
            })}
          </p>
        </div>
        <a
          href={version.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-primary hover:text-brand-primary/80 text-sm transition-colors"
        >
          <i className="fa-solid fa-external-link mr-1"></i>
          Voir
        </a>
      </div>

      {version.reviews && version.reviews.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-brand-text-secondary">
            Révisions :
          </p>
          {version.reviews.map((review) => (
            <div
              key={review.id}
              className={`p-3 rounded border ${
                review.status === "APPROVED"
                  ? "bg-green-500/10 border-green-500/30"
                  : review.status === "REJECTED"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-yellow-500/10 border-yellow-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium ${
                    review.status === "APPROVED"
                      ? "text-green-400"
                      : review.status === "REJECTED"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {review.status === "APPROVED"
                    ? "Approuvé"
                    : review.status === "REJECTED"
                      ? "Rejeté"
                      : "En attente"}
                </span>
                <span className="text-xs text-brand-text-secondary">
                  {formatDistanceToNow(new Date(review.reviewed_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
              {review.reviewer_name && (
                <p className="text-xs text-brand-text-secondary mb-1">
                  Par : {review.reviewer_name}
                </p>
              )}
              {review.reason && (
                <p className="text-xs text-brand-text-secondary">
                  Raison : {review.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
