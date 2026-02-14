"use client";

import { useCallback, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useApi } from "@/lib/api/useApi";
import { fr } from "date-fns/locale";

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor_name: string;
  details: string;
  type: "status_change" | "note" | "assignment" | "event" | "review";
}

interface AuditTrailSectionProps {
  dossierId: string;
}

export function AuditTrailSection({ dossierId }: AuditTrailSectionProps) {
  const api = useApi();
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditTrail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<AuditEntry[]>(
        `/api/admin/dossiers/${dossierId}/audit-trail`
      );
      setAuditEntries(Array.isArray(data) ? data : []);
    } catch {
      setError("Erreur lors du chargement de l'audit trail");
    } finally {
      setIsLoading(false);
    }
  }, [api, dossierId]);

  useEffect(() => {
    if (isExpanded) {
      fetchAuditTrail();
    }
  }, [dossierId, isExpanded, fetchAuditTrail]);

  const getTypeColor = (type: AuditEntry["type"]) => {
    switch (type) {
      case "status_change":
        return "bg-blue-500/20 text-blue-400";
      case "note":
        return "bg-purple-500/20 text-purple-400";
      case "assignment":
        return "bg-green-500/20 text-green-400";
      case "review":
        return "bg-yellow-500/20 text-yellow-400";
      case "event":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTypeLabel = (type: AuditEntry["type"]) => {
    switch (type) {
      case "status_change":
        return "Changement statut";
      case "note":
        return "Note interne";
      case "assignment":
        return "Assignation";
      case "review":
        return "Révision document";
      case "event":
        return "Événement";
      default:
        return "Autre";
    }
  };

  return (
    <div className="bg-brand-surface-light border border-brand-stroke rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-brand-text-primary">
          Piste d'audit
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
              Chargement de l'audit trail...
            </p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : auditEntries.length === 0 ? (
            <p className="text-brand-text-secondary">Aucune entrée d'audit</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-brand-dark-bg border border-brand-stroke rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeColor(entry.type)}`}
                        >
                          {getTypeLabel(entry.type)}
                        </span>
                      </div>
                      <p className="text-sm text-brand-text-primary">
                        <span className="font-medium">{entry.actor_name}</span>:{" "}
                        {entry.action}
                      </p>
                      {entry.details && (
                        <p className="text-xs text-brand-text-secondary mt-1">
                          {entry.details}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-brand-text-secondary whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(entry.timestamp), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
