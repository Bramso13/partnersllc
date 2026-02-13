"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useApi } from "@/lib/api/useApi";
import type { Agent, AgentDashboardData } from "./types";

export interface DossierAgentAssignments {
  verificateur: { id: string; full_name: string; email: string } | null;
  createur: { id: string; full_name: string; email: string } | null;
}

type AgentsContextValue = {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  getAgentDashboard: (agentId: string) => Promise<AgentDashboardData | null>;
  assignStep: (stepInstanceId: string, agentId: string) => Promise<void>;
  assignStepToDossier: (
    dossierId: string,
    stepInstanceId: string,
    agentId: string
  ) => Promise<void>;
  fetchDossierAgentAssignments: (
    dossierId: string
  ) => Promise<DossierAgentAssignments>;
  updateDossierAgentAssignment: (
    dossierId: string,
    assignmentType: "VERIFICATEUR" | "CREATEUR",
    agentId: string | null
  ) => Promise<void>;
};

const AgentsContext = createContext<AgentsContextValue | null>(null);

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<{ agents: Agent[] }>("/api/admin/agents");
      setAgents(data?.agents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAgentDashboard = useCallback(
    async (agentId: string): Promise<AgentDashboardData | null> => {
      try {
        const data = await api.get<AgentDashboardData>(
          `/api/admin/agents/${agentId}/dashboard`
        );
        return data ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const assignStep = useCallback(
    async (stepInstanceId: string, agentId: string) => {
      await api.patch(`/api/admin/step-instances/${stepInstanceId}/assign`, {
        agentId,
      });
    },
    []
  );

  const assignStepToDossier = useCallback(
    async (dossierId: string, stepInstanceId: string, agentId: string) => {
      await api.patch(`/api/admin/dossiers/${dossierId}/assign-agent`, {
        stepInstanceId,
        agentId,
      });
    },
    []
  );

  const fetchDossierAgentAssignments = useCallback(
    async (dossierId: string): Promise<DossierAgentAssignments> => {
      const data = await api.get<DossierAgentAssignments>(
        `/api/admin/dossiers/${dossierId}/dossier-agent-assignments`
      );
      return (
        data ?? {
          verificateur: null,
          createur: null,
        }
      );
    },
    []
  );

  const updateDossierAgentAssignment = useCallback(
    async (
      dossierId: string,
      assignmentType: "VERIFICATEUR" | "CREATEUR",
      agentId: string | null
    ) => {
      await api.put(
        `/api/admin/dossiers/${dossierId}/dossier-agent-assignments`,
        { assignmentType, agentId }
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      agents,
      isLoading,
      error,
      fetchAgents,
      getAgentDashboard,
      assignStep,
      assignStepToDossier,
      fetchDossierAgentAssignments,
      updateDossierAgentAssignment,
    }),
    [
      agents,
      isLoading,
      error,
      fetchAgents,
      getAgentDashboard,
      assignStep,
      assignStepToDossier,
      fetchDossierAgentAssignments,
      updateDossierAgentAssignment,
    ]
  );

  return (
    <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
  );
}

export function useAgents() {
  const ctx = useContext(AgentsContext);
  if (!ctx) {
    throw new Error("useAgents must be used within AgentsProvider");
  }
  return ctx;
}
