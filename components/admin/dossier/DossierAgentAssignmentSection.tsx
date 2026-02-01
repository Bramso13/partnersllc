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

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-sm focus:outline-none focus:ring-2 focus:ring-[#50b989] focus:border-transparent disabled:opacity-50";

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

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          `/api/admin/dossiers/${dossierId}/dossier-agent-assignments`
        );
        if (response.ok) {
          const data = await response.json();
          setAssignments(data);
        }
      } catch (e) {
        console.error("Error fetching assignments:", e);
      }
    })();
  }, [dossierId]);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/agents");
        if (!response.ok) throw new Error("Failed to fetch agents");
        const data = await response.json();
        const agents = data.agents || [];
        setVerificateurAgents(
          agents
            .filter((a: { agent_type?: string }) => a.agent_type === "VERIFICATEUR")
            .map((a: { id: string; name?: string; email: string }) => ({
              id: a.id,
              full_name: a.name || a.email,
              email: a.email,
            }))
        );
        setCreateurAgents(
          agents
            .filter((a: { agent_type?: string }) => a.agent_type === "CREATEUR")
            .map((a: { id: string; name?: string; email: string }) => ({
              id: a.id,
              full_name: a.name || a.email,
              email: a.email,
            }))
        );
      } catch (e) {
        console.error("Error fetching agents:", e);
        toast.error("Erreur lors du chargement des agents");
      } finally {
        setIsLoading(false);
      }
    })();
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentType, agentId }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur mise à jour");
      }
      const list = assignmentType === "VERIFICATEUR" ? verificateurAgents : createurAgents;
      const selected = agentId ? list.find((a) => a.id === agentId) ?? null : null;
      setAssignments((prev) => ({
        ...prev,
        [assignmentType.toLowerCase()]: selected,
      }));
      toast.success(
        agentId ? "Assignation enregistrée" : "Assignation retirée"
      );
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'assignation");
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
        <label className="block text-xs text-[#b7b7b7] mb-1.5">Vérificateur</label>
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
        L’assignation dossier contrôle la visibilité dans « Mes dossiers ». L’assignation par étape reste nécessaire pour le travail sur chaque étape.
      </div>
    </div>
  );
}
