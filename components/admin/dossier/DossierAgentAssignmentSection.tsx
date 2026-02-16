"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  useAgents,
  type DossierAgentAssignments,
} from "@/lib/contexts/agents/AgentsContext";

interface DossierAgentAssignmentSectionProps {
  dossierId: string;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-sm focus:outline-none focus:ring-2 focus:ring-[#50b989] focus:border-transparent disabled:opacity-50";

export function DossierAgentAssignmentSection({
  dossierId,
}: DossierAgentAssignmentSectionProps) {
  const {
    agents,
    isLoading,
    fetchAgents,
    fetchDossierAgentAssignments,
    updateDossierAgentAssignment,
  } = useAgents();
  const [assignments, setAssignments] = useState<DossierAgentAssignments>({
    verificateur: null,
    createur: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const verificateurAgents = agents
    .filter(
      (a) =>
        a.agent_type === "VERIFICATEUR" ||
        a.agent_type === "VERIFICATEUR_ET_CREATEUR"
    )
    .map((a) => ({
      id: a.id,
      full_name: a.name || a.email,
      email: a.email,
    }));
  const createurAgents = agents
    .filter(
      (a) =>
        a.agent_type === "CREATEUR" ||
        a.agent_type === "VERIFICATEUR_ET_CREATEUR"
    )
    .map((a) => ({
      id: a.id,
      full_name: a.name || a.email,
      email: a.email,
    }));

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const loadAssignments = useCallback(async () => {
    try {
      const data = await fetchDossierAgentAssignments(dossierId);
      setAssignments(data);
    } catch {
      // ignore
    }
  }, [dossierId]);

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleAssignmentChange = async (
    assignmentType: "VERIFICATEUR" | "CREATEUR",
    agentId: string | null
  ) => {
    try {
      setIsSaving(true);
      await updateDossierAgentAssignment(dossierId, assignmentType, agentId);
      const list =
        assignmentType === "VERIFICATEUR" ? verificateurAgents : createurAgents;
      const selected = agentId
        ? (list.find((a) => a.id === agentId) ?? null)
        : null;
      setAssignments((prev) => ({
        ...prev,
        [assignmentType.toLowerCase()]: selected,
      }));
      toast.success(
        agentId ? "Assignation enregistrée" : "Assignation retirée"
      );
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur lors de l'assignation"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-[#363636]/50 rounded-lg animate-pulse" />
        <div className="h-10 bg-[#363636]/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-[#b7b7b7] mb-1.5">
          Vérificateur
        </label>
        <select
          value={assignments.verificateur?.id ?? ""}
          onChange={(e) =>
            handleAssignmentChange("VERIFICATEUR", e.target.value || null)
          }
          disabled={isSaving}
          className={inputClass}
        >
          <option value="">Aucun</option>
          {verificateurAgents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-[#b7b7b7] mb-1.5">Créateur</label>
        <select
          value={assignments.createur?.id ?? ""}
          onChange={(e) =>
            handleAssignmentChange("CREATEUR", e.target.value || null)
          }
          disabled={isSaving}
          className={inputClass}
        >
          <option value="">Aucun</option>
          {createurAgents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-lg bg-[#1e1f22] border border-[#363636] p-3 text-xs text-[#b7b7b7]">
        <p className="font-medium text-[#f9f9f9] mb-0.5">Note</p>
        L'assignation dossier contrôle la visibilité dans « Mes dossiers ».
        L'assignation par étape reste nécessaire pour le travail sur chaque
        étape.
      </div>
    </div>
  );
}
