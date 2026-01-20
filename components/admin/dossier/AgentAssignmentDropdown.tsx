"use client";

import { useState, useEffect } from "react";
import { StepInstance, Step } from "@/lib/dossiers";

interface AgentAssignmentDropdownProps {
  dossierId: string;
  currentStepInstance: (StepInstance & { step?: Step | null }) | null | undefined;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

export function AgentAssignmentDropdown({
  dossierId,
  currentStepInstance,
}: AgentAssignmentDropdownProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    currentStepInstance?.assigned_to || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/admin/agents");
      if (!response.ok) throw new Error("Erreur lors du chargement des agents");

      const data = await response.json();
      setAgents(data);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError("Erreur lors du chargement des agents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentChange = async (newAgentId: string) => {
    if (!currentStepInstance) {
      setError("Aucune étape en cours");
      return;
    }

    if (newAgentId === selectedAgentId) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/assign-agent`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepInstanceId: currentStepInstance.id,
            agentId: newAgentId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de l'assignation de l'agent"
        );
      }

      setSelectedAgentId(newAgentId);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error("Error assigning agent:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentStepInstance) {
    return (
      <p className="text-sm text-brand-text-secondary">
        Aucune étape en cours à assigner
      </p>
    );
  }

  return (
    <div>
      <select
        value={selectedAgentId || ""}
        onChange={(e) => handleAssignmentChange(e.target.value)}
        disabled={isLoading || isUpdating}
        className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-stroke rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Non assigné</option>
        {agents && agents.length > 0 ? agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        )) : null}
      </select>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      {isUpdating && (
        <p className="text-brand-text-secondary text-sm mt-2">
          Mise à jour en cours...
        </p>
      )}
    </div>
  );
}
