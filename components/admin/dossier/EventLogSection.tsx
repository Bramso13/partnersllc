"use client";

import { useState, useEffect } from "react";
import { EventTimeline } from "@/components/EventTimeline";
import { BaseEvent } from "@/lib/events";

interface EventLogSectionProps {
  dossierId: string;
}

export function EventLogSection({ dossierId }: EventLogSectionProps) {
  const [events, setEvents] = useState<BaseEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) {
      fetchEvents();
    }
  }, [dossierId, isExpanded]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
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
          ) : (
            <EventTimeline
              events={events}
              showActor={true}
              maxHeight="max-h-96"
            />
          )}
        </div>
      )}
    </div>
  );
}
