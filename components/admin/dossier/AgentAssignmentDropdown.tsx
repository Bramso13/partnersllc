"use client";

import { useState, useEffect } from "react";
import type { StepInstance, Step } from "@/types/dossiers";
import { useAgents } from "@/lib/contexts/agents/AgentsContext";

interface AgentAssignmentDropdownProps {
  dossierId: string;
  currentStepInstance:
    | (StepInstance & { step?: Step | null })
    | null
    | undefined;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-sm focus:outline-none focus:ring-2 focus:ring-[#50b989] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

export function AgentAssignmentDropdown({
  dossierId,
  currentStepInstance,
}: AgentAssignmentDropdownProps) {
  const { agents, isLoading, fetchAgents, assignStepToDossier } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    currentStepInstance?.assigned_to ?? null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    setSelectedAgentId(currentStepInstance?.assigned_to ?? null);
  }, [currentStepInstance?.assigned_to]);

  const handleAssignmentChange = async (newAgentId: string) => {
    if (!currentStepInstance || newAgentId === (selectedAgentId ?? "")) return;
    setIsUpdating(true);
    setError(null);
    try {
      await assignStepToDossier(dossierId, currentStepInstance.id, newAgentId);
      setSelectedAgentId(newAgentId);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentStepInstance) {
    return (
      <p className="text-xs text-[#b7b7b7]">Aucune étape en cours à assigner</p>
    );
  }

  return (
    <div className="space-y-1.5">
      <select
        value={selectedAgentId ?? ""}
        onChange={(e) => handleAssignmentChange(e.target.value)}
        disabled={isLoading || isUpdating}
        className={inputClass}
      >
        <option value="">Non assigné</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {isUpdating && (
        <p className="text-xs text-[#b7b7b7] flex items-center gap-1">
          <i className="fa-solid fa-spinner fa-spin" /> Mise à jour…
        </p>
      )}
    </div>
  );
}
