"use client";

import { useState, useEffect, useCallback } from "react";

import type { AgentDashboardData } from "@/types/agents";
import { useAgents } from "@/lib/contexts/agents/AgentsContext";
import { AgentDashboardPanel } from "./AgentDashboardPanel";

export function AgentsManagementContent() {
  const {
    agents,
    isLoading: isLoadingAgents,
    error,
    fetchAgents,
    getAgentDashboard,
    assignStep,
  } = useAgents();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<AgentDashboardData | null>(
    null
  );
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (agents.length > 0 && !activeAgentId) {
      setActiveAgentId(agents[0].id);
    }
  }, [agents, activeAgentId]);

  const fetchDashboard = useCallback(async () => {
    if (!activeAgentId) return;
    setIsLoadingDashboard(true);
    try {
      const data = await getAgentDashboard(activeAgentId);
      setDashboardData(data ?? null);
    } catch {
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [activeAgentId, getAgentDashboard]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAgentChange = (agentId: string) => {
    setActiveAgentId(agentId);
    setDashboardData(null);
  };

  const handleAssignStep = async (stepInstanceId: string) => {
    if (!activeAgentId) return;
    setAssignError(null);
    try {
      await assignStep(stepInstanceId, activeAgentId);
      await fetchDashboard();
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Erreur lors de l'assignation"
      );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoadingAgents) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-text-primary">
            Gestion des agents
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-text-primary">
            Gestion des agents
          </h1>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-brand-bg flex items-center justify-center mb-4">
            <i className="fa-solid fa-user-tie text-brand-text-secondary text-xl"></i>
          </div>
          <h3 className="text-lg font-medium text-brand-text-primary mb-2">
            Aucun agent
          </h3>
          <p className="text-brand-text-secondary">
            Invitez un agent pour commencer à gérer les dossiers.
          </p>
        </div>
      </div>
    );
  }

  const activeAgent = agents.find((a) => a.id === activeAgentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-text-primary">
          Gestion des agents
        </h1>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-3 py-2 text-sm text-brand-text-secondary hover:text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg transition-colors"
          disabled={isLoadingDashboard}
        >
          <i
            className={`fa-solid fa-rotate ${isLoadingDashboard ? "animate-spin" : ""}`}
          ></i>
          Actualiser
        </button>
      </div>

      {(error || assignError) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {assignError ?? error}
        </div>
      )}

      <div className="border-b border-brand-border">
        <nav
          className="-mb-px flex space-x-4 overflow-x-auto"
          aria-label="Tabs"
        >
          {agents.map((agent) => {
            const isActive = agent.id === activeAgentId;
            return (
              <button
                key={agent.id}
                onClick={() => handleAgentChange(agent.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
                      ? "border-brand-gold text-brand-gold"
                      : "border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-border"
                  }
                `}
              >
                <span
                  className={`
                  inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold
                  ${isActive ? "bg-brand-gold text-brand-bg" : "bg-brand-surface text-brand-text-secondary"}
                `}
                >
                  {getInitials(agent.name)}
                </span>
                <span className="hidden sm:inline">{agent.name}</span>
                <span
                  className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${
                    agent.agent_type === "VERIFICATEUR"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-purple-500/20 text-purple-400"
                  }
                `}
                >
                  {agent.agent_type === "VERIFICATEUR" ? "Vérif." : "Créat."}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeAgentId && (
        <AgentDashboardPanel
          agentId={activeAgentId}
          agentName={activeAgent?.name || "Agent"}
          dashboardData={dashboardData}
          isLoading={isLoadingDashboard}
          onAssignStep={handleAssignStep}
          onRefresh={fetchDashboard}
        />
      )}
    </div>
  );
}
