"use client";

import { useState, useEffect, useCallback } from "react";
import type { Agent, AgentDashboardData } from "@/types/agents";
import { AgentDashboardPanel } from "./AgentDashboardPanel";

export function AgentsManagementContent() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<AgentDashboardData | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents list
  useEffect(() => {
    async function fetchAgents() {
      setIsLoadingAgents(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/agents");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des agents");
        }
        const data = await response.json();
        setAgents(data.agents || []);
        
        // Select first agent by default
        if (data.agents && data.agents.length > 0 && !activeAgentId) {
          setActiveAgentId(data.agents[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setIsLoadingAgents(false);
      }
    }

    fetchAgents();
  }, []);

  // Fetch dashboard data for active agent
  const fetchDashboard = useCallback(async () => {
    if (!activeAgentId) return;

    setIsLoadingDashboard(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/agents/${activeAgentId}/dashboard`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du dashboard");
      }
      const data: AgentDashboardData = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [activeAgentId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle agent tab change
  const handleAgentChange = (agentId: string) => {
    setActiveAgentId(agentId);
    setDashboardData(null);
  };

  // Handle step assignment
  const handleAssignStep = async (stepInstanceId: string) => {
    if (!activeAgentId) return;

    try {
      const response = await fetch(`/api/admin/step-instances/${stepInstanceId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: activeAgentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'assignation");
      }

      // Refresh dashboard
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'assignation");
    }
  };

  // Get agent initials for tab display
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Loading state for agents
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

  // Empty state - no agents
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-text-primary">
          Gestion des agents
        </h1>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-3 py-2 text-sm text-brand-text-secondary hover:text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg transition-colors"
          disabled={isLoadingDashboard}
        >
          <i className={`fa-solid fa-rotate ${isLoadingDashboard ? "animate-spin" : ""}`}></i>
          Actualiser
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Agent Tabs */}
      <div className="border-b border-brand-border">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {agents.map((agent) => {
            const isActive = agent.id === activeAgentId;
            return (
              <button
                key={agent.id}
                onClick={() => handleAgentChange(agent.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? "border-brand-gold text-brand-gold"
                    : "border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-border"
                  }
                `}
              >
                <span className={`
                  inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold
                  ${isActive ? "bg-brand-gold text-brand-bg" : "bg-brand-surface text-brand-text-secondary"}
                `}>
                  {getInitials(agent.name)}
                </span>
                <span className="hidden sm:inline">{agent.name}</span>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${agent.agent_type === "VERIFICATEUR" 
                    ? "bg-blue-500/20 text-blue-400" 
                    : "bg-purple-500/20 text-purple-400"
                  }
                `}>
                  {agent.agent_type === "VERIFICATEUR" ? "Vérif." : "Créat."}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dashboard Panel */}
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
