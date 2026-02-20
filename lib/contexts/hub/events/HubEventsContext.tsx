"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useApi } from "@/lib/api/useApi";
import type { HubEvent, EventsResponse, RegisterResponse } from "@/types/hub-events";

interface HubEventsContextValue {
  events: HubEvent[];
  total: number;
  isLoading: boolean;
  isRegistering: boolean;
  error: string | null;
  fetchEvents: (options?: { upcoming?: boolean; tag?: string }) => Promise<void>;
  register: (eventId: string) => Promise<RegisterResponse>;
  unregister: (eventId: string) => Promise<void>;
}

const HubEventsContext = createContext<HubEventsContextValue | null>(null);

export function HubEventsProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [events, setEvents]           = useState<HubEvent[]>([]);
  const [total, setTotal]             = useState(0);
  const [isLoading, setIsLoading]     = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fetchEvents = useCallback(
    async (options: { upcoming?: boolean; tag?: string } = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (options.upcoming === false) params.set("upcoming", "false");
        if (options.tag) params.set("tag", options.tag);

        const data = await api.get<EventsResponse>(
          `/api/hub/events${params.toString() ? `?${params}` : ""}`
        );
        setEvents(data.events);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(async (eventId: string): Promise<RegisterResponse> => {
    setIsRegistering(true);
    try {
      const data = await api.post<RegisterResponse>(
        `/api/hub/events/${eventId}/register`
      );
      // Mettre à jour l'état local
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                is_registered: true,
                registration_status: data.waitlisted ? "waitlisted" : "registered",
                attendee_count: data.waitlisted ? e.attendee_count : e.attendee_count + 1,
              }
            : e
        )
      );
      return data;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const unregister = useCallback(async (eventId: string): Promise<void> => {
    setIsRegistering(true);
    try {
      await api.delete(`/api/hub/events/${eventId}/register`);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                is_registered: false,
                registration_status: null,
                attendee_count: Math.max(0, e.attendee_count - 1),
              }
            : e
        )
      );
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const value = useMemo(
    () => ({ events, total, isLoading, isRegistering, error, fetchEvents, register, unregister }),
    [events, total, isLoading, isRegistering, error, fetchEvents, register, unregister]
  );

  return (
    <HubEventsContext.Provider value={value}>
      {children}
    </HubEventsContext.Provider>
  );
}

export function useHubEvents() {
  const ctx = useContext(HubEventsContext);
  if (!ctx) throw new Error("useHubEvents must be used within HubEventsProvider");
  return ctx;
}
