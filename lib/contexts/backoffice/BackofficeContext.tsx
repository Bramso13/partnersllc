"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import { useApi } from "@/lib/api/useApi";
import type {
  DossierSearchResult,
  DossierResetData,
  CreateDossierForExistingClientData,
  CreateDossierWithNewClientData,
  EntityType,
  EntitiesResponse,
  DossierObservation,
} from "./types";

type BackofficeContextValue = {
  searchDossiers: (query: string) => Promise<DossierSearchResult[]>;
  getDossierSummary: (id: string) => Promise<DossierSearchResult | null>;
  resetDossier: (id: string, data: DossierResetData) => Promise<void>;
  createDossierForExistingClient: (
    data: CreateDossierForExistingClientData
  ) => Promise<{ dossierId: string }>;
  createDossierWithNewClient: (
    data: CreateDossierWithNewClientData
  ) => Promise<{ dossierId: string; userId: string }>;
  fetchEntities: (
    type: EntityType,
    params: { page?: number; search?: string }
  ) => Promise<EntitiesResponse>;
  updateDossierStatus: (
    id: string,
    status: string,
    reason: string
  ) => Promise<void>;
  getDossierObservation: (dossierId: string) => Promise<DossierObservation>;
  setDossierTestFlag: (dossierId: string, isTest: boolean) => Promise<void>;
  deleteTestUser: (userId: string) => Promise<void>;
};

const BackofficeContext = createContext<BackofficeContextValue | null>(null);

export function BackofficeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const api = useApi();

  const searchDossiers = useCallback(
    async (query: string): Promise<DossierSearchResult[]> => {
      const data = await api.get<
        DossierSearchResult[] | { dossiers: DossierSearchResult[] }
      >(
        `/api/admin/backoffice/entities?type=dossiers&search=${encodeURIComponent(query)}&per_page=20`
      );
      if (Array.isArray(data)) return data;
      return (data as { dossiers?: DossierSearchResult[] }).dossiers ?? [];
    },
    []
  );

  const getDossierSummary = useCallback(
    async (id: string): Promise<DossierSearchResult | null> => {
      try {
        const data = await api.get<{ dossier: DossierSearchResult }>(
          `/api/admin/backoffice/dossier-summary/${id}`
        );
        return data.dossier ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const resetDossier = useCallback(
    async (id: string, data: DossierResetData): Promise<void> => {
      await api.post(`/api/admin/dossiers/${id}/reset`, data);
    },
    []
  );

  const createDossierForExistingClient = useCallback(
    async (
      data: CreateDossierForExistingClientData
    ): Promise<{ dossierId: string }> => {
      const res = await api.post<{ dossierId: string }>(
        "/api/admin/dossiers/create",
        data
      );
      return res;
    },
    []
  );

  const createDossierWithNewClient = useCallback(
    async (
      data: CreateDossierWithNewClientData
    ): Promise<{ dossierId: string; userId: string }> => {
      const res = await api.post<{ dossierId: string; userId: string }>(
        "/api/admin/clients/create",
        {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          product_id: data.product_id,
          initial_status: data.initial_status,
        }
      );
      return res;
    },
    []
  );

  const fetchEntities = useCallback(
    async (
      type: EntityType,
      params: { page?: number; search?: string }
    ): Promise<EntitiesResponse> => {
      const qs = new URLSearchParams({
        type,
        page: String(params.page ?? 1),
        per_page: "25",
      });
      if (params.search) qs.set("search", params.search);
      const data = await api.get<EntitiesResponse>(
        `/api/admin/backoffice/entities?${qs.toString()}`
      );
      return data;
    },
    []
  );

  const updateDossierStatus = useCallback(
    async (id: string, status: string, reason: string): Promise<void> => {
      await api.post(`/api/admin/dossiers/${id}/status`, { status, reason });
    },
    []
  );

  const getDossierObservation = useCallback(
    async (dossierId: string): Promise<DossierObservation> => {
      const [summaryRes, eventsRes, notifRes, stepsRes, historyRes] =
        await Promise.all([
          getDossierSummary(dossierId),
          api.get<DossierObservation["events"]>(
            `/api/admin/dossiers/${dossierId}/events`
          ),
          api.get<{
            notifications: DossierObservation["notifications"];
          }>(`/api/admin/notifications?dossier_id=${dossierId}&limit=200`),
          api.get<{ stepInstances: DossierObservation["stepInstances"] }>(
            `/api/admin/dossiers/${dossierId}/step-instances`
          ),
          api.get<{ statusHistory: DossierObservation["statusHistory"] }>(
            `/api/admin/dossiers/${dossierId}/status-history`
          ),
        ]);

      return {
        dossierSummary: summaryRes,
        events: Array.isArray(eventsRes) ? eventsRes : [],
        notifications: notifRes?.notifications ?? [],
        stepInstances: stepsRes?.stepInstances ?? [],
        statusHistory: historyRes?.statusHistory ?? [],
      };
    },
    []
  );

  const setDossierTestFlag = useCallback(
    async (dossierId: string, isTest: boolean): Promise<void> => {
      await api.patch(`/api/admin/dossiers/${dossierId}/test-flag`, {
        is_test: isTest,
      });
    },
    []
  );

  const deleteTestUser = useCallback(async (userId: string): Promise<void> => {
    await api.delete(`/api/admin/test/users/${userId}`);
  }, []);

  const value = useMemo(
    () => ({
      searchDossiers,
      getDossierSummary,
      resetDossier,
      createDossierForExistingClient,
      createDossierWithNewClient,
      fetchEntities,
      updateDossierStatus,
      getDossierObservation,
      setDossierTestFlag,
      deleteTestUser,
    }),
    [
      searchDossiers,
      getDossierSummary,
      resetDossier,
      createDossierForExistingClient,
      createDossierWithNewClient,
      fetchEntities,
      updateDossierStatus,
      getDossierObservation,
      setDossierTestFlag,
      deleteTestUser,
    ]
  );

  return (
    <BackofficeContext.Provider value={value}>
      {children}
    </BackofficeContext.Provider>
  );
}

export function useBackoffice() {
  const ctx = useContext(BackofficeContext);
  if (!ctx) {
    throw new Error("useBackoffice must be used within BackofficeProvider");
  }
  return ctx;
}
