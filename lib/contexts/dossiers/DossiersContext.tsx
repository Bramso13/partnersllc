"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import { useApi } from "@/lib/api/useApi";
import type { AdvisorInfo, DossierApiResponse } from "./types";

type DossiersContextValue = {
  fetchDossier: (id: string) => Promise<DossierApiResponse | null>;
  fetchDossierAdvisor: (dossierId: string) => Promise<AdvisorInfo | null>;
  updateDossierStatus: (
    dossierId: string,
    status: string,
    reason?: string
  ) => Promise<void>;
};

const DossiersContext = createContext<DossiersContextValue | null>(null);

export function DossiersProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();

  const fetchDossier = useCallback(
    async (id: string): Promise<DossierApiResponse | null> => {
      try {
        const data = await api.get<DossierApiResponse>(`/api/dossiers/${id}`);
        return data ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const fetchDossierAdvisor = useCallback(
    async (dossierId: string): Promise<AdvisorInfo | null> => {
      try {
        const data = await api.get<AdvisorInfo>(
          `/api/dossiers/${dossierId}/advisor`
        );
        return data ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const updateDossierStatus = useCallback(
    async (dossierId: string, status: string, reason?: string) => {
      await api.patch(`/api/admin/dossiers/${dossierId}/status`, {
        status,
        ...(reason ? { reason } : {}),
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      fetchDossier,
      fetchDossierAdvisor,
      updateDossierStatus,
    }),
    [fetchDossier, fetchDossierAdvisor, updateDossierStatus]
  );

  return (
    <DossiersContext.Provider value={value}>
      {children}
    </DossiersContext.Provider>
  );
}

export function useDossiers() {
  const ctx = useContext(DossiersContext);
  if (!ctx) {
    throw new Error("useDossiers must be used within DossiersProvider");
  }
  return ctx;
}
