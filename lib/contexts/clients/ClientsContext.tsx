"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useApi } from "@/lib/api/useApi";
import type {
  ClientProfile,
  ClientWithDossierCount,
  CreateClientData,
  DossierSummary,
  BaseEvent,
} from "./types";

type ClientsContextValue = {
  clients: ClientWithDossierCount[];
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  getClient: (id: string) => Promise<ClientProfile | null>;
  createClient: (data: CreateClientData) => Promise<void>;
  updateClientStatus: (
    clientId: string,
    status: "PENDING" | "ACTIVE" | "SUSPENDED",
    reason: string
  ) => Promise<void>;
  archiveClient: (clientId: string, reason: string) => Promise<void>;
  fetchClientEvents: (clientId: string) => Promise<BaseEvent[]>;
  fetchClientDossiers: (clientId: string) => Promise<DossierSummary[]>;
};

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [clients, setClients] = useState<ClientWithDossierCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<
        ClientWithDossierCount[] | { clients?: ClientWithDossierCount[] }
      >("/api/admin/clients");

      const list = Array.isArray(data) ? data : (data?.clients ?? []);
      setClients(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getClient = useCallback(
    async (id: string): Promise<ClientProfile | null> => {
      try {
        const data = await api.get<ClientProfile>(`/api/admin/clients/${id}`);
        return data ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const createClient = useCallback(async (data: CreateClientData) => {
    await api.post<{ success?: boolean }>("/api/admin/clients/create", data);
  }, []);

  const updateClientStatus = useCallback(
    async (
      clientId: string,
      status: "PENDING" | "ACTIVE" | "SUSPENDED",
      reason: string
    ) => {
      await api.post(`/api/admin/clients/${clientId}/status`, {
        status,
        reason,
      });
    },
    []
  );

  const archiveClient = useCallback(
    async (clientId: string, reason: string) => {
      await api.post(`/api/admin/clients/${clientId}/archive`, { reason });
    },
    []
  );

  const fetchClientEvents = useCallback(
    async (clientId: string): Promise<BaseEvent[]> => {
      const data = await api.get<BaseEvent[]>(
        `/api/admin/clients/${clientId}/events`
      );
      return Array.isArray(data) ? data : [];
    },
    []
  );

  const fetchClientDossiers = useCallback(
    async (clientId: string): Promise<DossierSummary[]> => {
      const data = await api.get<DossierSummary[]>(
        `/api/admin/clients/${clientId}/dossiers`
      );
      return Array.isArray(data) ? data : [];
    },
    []
  );

  const value = useMemo(
    () => ({
      clients,
      isLoading,
      error,
      fetchClients,
      getClient,
      createClient,
      updateClientStatus,
      archiveClient,
      fetchClientEvents,
      fetchClientDossiers,
    }),
    [
      clients,
      isLoading,
      error,
      fetchClients,
      getClient,
      createClient,
      updateClientStatus,
      archiveClient,
      fetchClientEvents,
      fetchClientDossiers,
    ]
  );

  return (
    <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) {
    throw new Error("useClients must be used within ClientsProvider");
  }
  return ctx;
}
