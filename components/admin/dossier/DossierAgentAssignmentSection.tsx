"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Agent {
  id: string;
  full_name: string;
  email: string;
}

interface DossierAgentAssignments {
  verificateur: Agent | null;
  createur: Agent | null;
}

interface DossierAgentAssignmentSectionProps {
  dossierId: string;
}

export function DossierAgentAssignmentSection({
  dossierId,
}: DossierAgentAssignmentSectionProps) {
  const [assignments, setAssignments] = useState<DossierAgentAssignments>({
    verificateur: null,
    createur: null,
  });
  const [verificateurAgents, setVerificateurAgents] = useState<Agent[]>([]);
  const [createurAgents, setCreateurAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current assignments
  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch(
          `/api/admin/dossiers/${dossierId}/dossier-agent-assignments`
        );
        if (response.ok) {
          const data = await response.json();
          setAssignments(data);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    }

    fetchAssignments();
  }, [dossierId]);

  // Fetch agents by type
  useEffect(() => {
    async function fetchAgents() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/agents");
        if (!response.ok) {
          throw new Error("Failed to fetch agents");
        }

        const data = await response.json();
        const agents = data.agents || [];

        // Filter agents by type (API returns only active agents)
        const verificateurs = agents
          .filter((agent: { agent_type?: string }) => agent.agent_type === "VERIFICATEUR")
          .map((agent: { id: string; name?: string; email: string }) => ({
            id: agent.id,
            full_name: agent.name || agent.email,
            email: agent.email,
          }));

        const createurs = agents
          .filter((agent: { agent_type?: string }) => agent.agent_type === "CREATEUR")
          .map((agent: { id: string; name?: string; email: string }) => ({
            id: agent.id,
            full_name: agent.name || agent.email,
            email: agent.email,
          }));

        setVerificateurAgents(verificateurs);
        setCreateurAgents(createurs);
      } catch (error) {
        console.error("Error fetching agents:", error);
        toast.error("Erreur lors du chargement des agents");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgents();
  }, []);

  const handleAssignmentChange = async (
    assignmentType: "VERIFICATEUR" | "CREATEUR",
    agentId: string | null
  ) => {
    try {
      setIsSaving(true);

      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/dossier-agent-assignments`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignmentType,
            agentId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update assignment");
      }

      // Update local state
      const agentsList =
        assignmentType === "VERIFICATEUR" ? verificateurAgents : createurAgents;
      const selectedAgent = agentId
        ? agentsList.find((a) => a.id === agentId) || null
        : null;

      setAssignments((prev) => ({
        ...prev,
        [assignmentType.toLowerCase()]: selectedAgent,
      }));

      toast.success(
        agentId
          ? `Agent ${assignmentType.toLowerCase()} assigné avec succès`
          : `Agent ${assignmentType.toLowerCase()} désassigné`
      );

      // Refresh the page to update all related data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'assignation"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-brand-stroke rounded w-1/2 mb-2"></div>
          <div className="h-10 bg-brand-stroke rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-brand-stroke rounded w-1/2 mb-2"></div>
          <div className="h-10 bg-brand-stroke rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Verificateur Assignment */}
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">
          Agent Vérificateur
        </label>
        <select
          value={assignments.verificateur?.id || ""}
          onChange={(e) =>
            handleAssignmentChange(
              "VERIFICATEUR",
              e.target.value || null
            )
          }
          disabled={isSaving}
          className="w-full px-3 py-2 border border-brand-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent text-brand-text-primary disabled:opacity-50"
        >
          <option value="">Aucun</option>
          {verificateurAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.full_name}
            </option>
          ))}
        </select>
        <p className="text-xs text-brand-text-secondary mt-1">
          Vérificateur assigné pour ce dossier
        </p>
      </div>

      {/* Createur Assignment */}
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">
          Agent Créateur
        </label>
        <select
          value={assignments.createur?.id || ""}
          onChange={(e) =>
            handleAssignmentChange(
              "CREATEUR",
              e.target.value || null
            )
          }
          disabled={isSaving}
          className="w-full px-3 py-2 border border-brand-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent text-brand-text-primary disabled:opacity-50"
        >
          <option value="">Aucun</option>
          {createurAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.full_name}
            </option>
          ))}
        </select>
        <p className="text-xs text-brand-text-secondary mt-1">
          Créateur assigné pour ce dossier
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-medium mb-1">ℹ️ Note</p>
        <p>
          L'assignation au niveau dossier contrôle la visibilité dans "Mes dossiers"
          pour les agents. L'assignation par étape (ci-dessus) reste nécessaire pour
          le travail effectif sur chaque step.
        </p>
      </div>
    </div>
  );
}
