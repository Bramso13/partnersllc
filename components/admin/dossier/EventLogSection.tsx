"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Event {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_type: string | null;
  actor_id: string | null;
  payload: Record<string, any>;
  created_at: string;
}

interface EventLogSectionProps {
  dossierId: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  DOSSIER_CREATED: "Dossier créé",
  DOSSIER_STATUS_CHANGED: "Statut changé",
  STEP_STARTED: "Étape démarrée",
  STEP_COMPLETED: "Étape complétée",
  DOCUMENT_UPLOADED: "Document uploadé",
  DOCUMENT_REVIEWED: "Document révisé",
  PAYMENT_RECEIVED: "Paiement reçu",
  PAYMENT_FAILED: "Paiement échoué",
  MESSAGE_SENT: "Message envoyé",
  ERROR: "Erreur",
};

export function EventLogSection({ dossierId }: EventLogSectionProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [dossierId]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/events`);
      if (!response.ok) throw new Error("Erreur lors du chargement des événements");

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Erreur lors du chargement des événements");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface-light border border-brand-stroke rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-brand-text-primary">
          Journal des événements
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
              Chargement des événements...
            </p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : events.length === 0 ? (
            <p className="text-brand-text-secondary">Aucun événement</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventItem({ event }: { event: Event }) {
  const [isPayloadExpanded, setIsPayloadExpanded] = useState(false);

  return (
    <div className="p-4 bg-brand-dark-bg border border-brand-stroke rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-xs font-medium rounded">
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </span>
            {event.actor_type && (
              <span className="text-xs text-brand-text-secondary">
                par {event.actor_type}
              </span>
            )}
          </div>
          <p className="text-xs text-brand-text-secondary">
            {formatDistanceToNow(new Date(event.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </p>
        </div>
        <button
          onClick={() => setIsPayloadExpanded(!isPayloadExpanded)}
          className="text-brand-text-secondary hover:text-brand-text-primary text-xs transition-colors"
        >
          {isPayloadExpanded ? "Masquer" : "Voir"} JSON
        </button>
      </div>

      {isPayloadExpanded && (
        <div className="mt-3 p-3 bg-black/30 rounded overflow-x-auto">
          <pre className="text-xs text-brand-text-secondary font-mono">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
