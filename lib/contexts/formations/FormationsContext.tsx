"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useApi } from "@/lib/api/useApi";
import type { Formation } from "@/types/formations";

type FormationsContextValue = {
  formations: Formation[];
  isLoading: boolean;
  error: string | null;
  fetchFormations: () => Promise<void>;
  getFormation: (id: string) => Promise<Formation | null>;
  deleteFormation: (id: string) => Promise<void>;
};

const FormationsContext = createContext<FormationsContextValue | null>(null);

export function FormationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const api = useApi();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFormations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<{ formations: Formation[] }>(
        "/api/admin/formations"
      );
      setFormations(data?.formations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFormation = useCallback(
    async (id: string): Promise<Formation | null> => {
      try {
        const data = await api.get<{ formation: Formation }>(
          `/api/admin/formations/${id}`
        );
        return data?.formation ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const deleteFormation = useCallback(async (id: string) => {
    await api.delete(`/api/admin/formations/${id}`);
  }, []);

  const value = useMemo(
    () => ({
      formations,
      isLoading,
      error,
      fetchFormations,
      getFormation,
      deleteFormation,
    }),
    [
      formations,
      isLoading,
      error,
      fetchFormations,
      getFormation,
      deleteFormation,
    ]
  );

  return (
    <FormationsContext.Provider value={value}>
      {children}
    </FormationsContext.Provider>
  );
}

export function useFormations() {
  const ctx = useContext(FormationsContext);
  if (!ctx) {
    throw new Error("useFormations must be used within FormationsProvider");
  }
  return ctx;
}
