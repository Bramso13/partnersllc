"use client";

import Link from "next/link";
import { AgentDossier } from "@/lib/agent-metrics";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "à l'instant";
  } else if (diffMin < 60) {
    return `il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
  } else if (diffHour < 24) {
    return `il y a ${diffHour} heure${diffHour > 1 ? "s" : ""}`;
  } else if (diffDay < 7) {
    return `il y a ${diffDay} jour${diffDay > 1 ? "s" : ""}`;
  } else {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

interface MyDossiersSectionProps {
  dossiers: AgentDossier[];
}

export function MyDossiersSection({ dossiers }: MyDossiersSectionProps) {
  if (dossiers.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
          Mes dossiers
        </h2>
        <div className="text-center py-8 text-brand-text-secondary">
          <i className="fa-solid fa-folder-open text-4xl mb-2 opacity-50"></i>
          <p>Aucun dossier assigné</p>
          <p className="text-sm mt-2">
            Les nouveaux dossiers vous seront assignés automatiquement
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-dark-bg border border-brand-border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
        Mes dossiers
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dossiers.map((dossier) => (
          <Link
            key={dossier.id}
            href={`/admin/dossiers/${dossier.id}`}
            className="bg-brand-dark-bg border border-brand-border rounded-lg p-4 hover:border-brand-accent transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-brand-text-primary mb-1">
                  {dossier.client_name}
                </h3>
                <p className="text-sm text-brand-text-secondary">
                  {dossier.dossier_number}
                </p>
              </div>
              {dossier.has_unread_messages && (
                <div className="flex-shrink-0 ml-2">
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    <i className="fa-solid fa-circle text-[8px]"></i>
                  </span>
                </div>
              )}
            </div>

            {dossier.product_name && (
              <div className="mb-2">
                <span className="text-xs text-brand-text-secondary bg-brand-dark-surface px-2 py-1 rounded">
                  {dossier.product_name}
                </span>
              </div>
            )}

            {dossier.current_step_label && (
              <div className="mb-2">
                <p className="text-sm text-brand-text-secondary">
                  Étape actuelle:{" "}
                  <span className="text-brand-text-primary font-medium">
                    {dossier.current_step_label}
                  </span>
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border">
              <div className="text-sm text-brand-text-secondary">
                {dossier.pending_documents_count > 0 ? (
                  <span className="text-yellow-400">
                    <i className="fa-solid fa-file-circle-question mr-1"></i>
                    {dossier.pending_documents_count} document
                    {dossier.pending_documents_count > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-green-400">
                    <i className="fa-solid fa-check-circle mr-1"></i>
                    À jour
                  </span>
                )}
              </div>
              {dossier.last_activity && (
                <div className="text-xs text-brand-text-secondary">
                  {formatRelativeTime(dossier.last_activity)}
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              {dossier.pending_documents_count > 0 && (
                <Link
                  href={`/admin/dossiers/${dossier.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded hover:bg-yellow-400/20 transition-colors"
                >
                  <i className="fa-solid fa-eye mr-1"></i>
                  Réviser
                </Link>
              )}
              <Link
                href={`/admin/dossiers/${dossier.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs bg-brand-accent/10 text-brand-accent px-3 py-1 rounded hover:bg-brand-accent/20 transition-colors"
              >
                <i className="fa-solid fa-folder-open mr-1"></i>
                Voir
              </Link>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}