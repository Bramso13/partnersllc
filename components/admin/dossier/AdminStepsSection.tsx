"use client";

import { useState, useEffect } from "react";
import { SendDocumentsModal } from "./SendDocumentsModal";
import { toast } from "sonner";

const SIMPLIFIED_VALIDATION = true;

type ValidationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

const STATUS_OPTIONS: { value: ValidationStatus; label: string; pill: string }[] = [
  { value: "DRAFT", label: "Brouillon", pill: "bg-[#363636] text-[#b7b7b7]" },
  { value: "SUBMITTED", label: "Soumis", pill: "bg-blue-500/20 text-blue-400" },
  { value: "UNDER_REVIEW", label: "En révision", pill: "bg-amber-500/20 text-amber-400" },
  { value: "APPROVED", label: "Approuvé", pill: "bg-emerald-500/20 text-emerald-400" },
  { value: "REJECTED", label: "Rejeté", pill: "bg-red-500/20 text-red-400" },
];

interface AdminStepInstance {
  id: string;
  step_id: string;
  dossier_id: string;
  started_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  validation_status: ValidationStatus | null;
  step: {
    id: string;
    label: string;
    description: string | null;
    step_type: "CLIENT" | "ADMIN";
  };
}

interface AdminStepsSectionProps {
  dossierId: string;
  productId: string;
}

const selectClass =
  "px-2.5 py-1.5 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-xs focus:outline-none focus:ring-1 focus:ring-[#50b989] disabled:opacity-50";

export function AdminStepsSection({
  dossierId,
  productId,
}: AdminStepsSectionProps) {
  const [adminSteps, setAdminSteps] = useState<AdminStepInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<AdminStepInstance | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [agents, setAgents] = useState<
    { id: string; name: string; email: string; agent_type: "VERIFICATEUR" | "CREATEUR" }[]
  >([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchSteps = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/dossiers/${dossierId}/admin-steps`);
      if (!res.ok) throw new Error("Erreur chargement étapes");
      const data = await res.json();
      setAdminSteps(data.stepInstances ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSteps();
  }, [dossierId]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingAgents(true);
        const res = await fetch("/api/admin/agents");
        if (!res.ok) throw new Error("Erreur agents");
        const data = await res.json();
        setAgents(data.agents ?? []);
      } catch {
        // ignore
      } finally {
        setLoadingAgents(false);
      }
    })();
  }, []);

  const handleStatusChange = async (
    step: AdminStepInstance,
    newStatus: ValidationStatus
  ) => {
    try {
      setUpdatingId(step.id);
      const res = await fetch(
        `/api/admin/dossiers/${dossierId}/steps/${step.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Erreur mise à jour statut");
      await fetchSteps();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssign = async (step: AdminStepInstance, agentId: string) => {
    try {
      setUpdatingId(step.id);
      const res = await fetch(
        `/api/admin/step-instances/${step.id}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: agentId || null }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur assignation");
      }
      await fetchSteps();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleValidate = async (stepInstanceId: string) => {
    try {
      setValidatingId(stepInstanceId);
      if (SIMPLIFIED_VALIDATION) {
        const valRes = await fetch(
          `/api/admin/dossiers/${dossierId}/validation`
        );
        if (valRes.ok) {
          const valData = await valRes.json();
          const si = valData.stepInstances?.find(
            (x: { id: string }) => x.id === stepInstanceId
          );
          if (si?.fields?.length) {
            for (const f of si.fields.filter(
              (f: { validation_status: string }) => f.validation_status !== "APPROVED"
            )) {
              await fetch(
                `/api/admin/dossiers/${dossierId}/fields/${f.id}/approve`,
                { method: "POST" }
              );
            }
          }
          if (si?.documents?.length) {
            for (const d of si.documents.filter(
              (d: { status: string }) => d.status !== "APPROVED"
            )) {
              await fetch(
                `/api/admin/dossiers/${dossierId}/documents/${d.id}/approve`,
                { method: "POST" }
              );
            }
          }
        }
      }
      const res = await fetch(
        `/api/admin/dossiers/${dossierId}/steps/${stepInstanceId}/approve`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Erreur validation");
      }
      toast.success("Étape validée");
      await fetchSteps();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur validation");
    } finally {
      setValidatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-6 flex items-center justify-center min-h-[120px]">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-[#50b989]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-6 text-center">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button
          type="button"
          onClick={fetchSteps}
          className="text-sm text-[#50b989] hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (adminSteps.length === 0) return null;

  return (
    <>
      <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#363636] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#f9f9f9]">
            Étapes admin
          </h2>
          <button
            type="button"
            onClick={fetchSteps}
            className="text-[#b7b7b7] hover:text-[#f9f9f9] transition-colors p-1"
            title="Actualiser"
          >
            <i className="fa-solid fa-arrows-rotate" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {adminSteps.map((stepInstance) => {
            const status =
              stepInstance.validation_status ?? "DRAFT";
            const statusConfig =
              STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
            const isCompleted = !!stepInstance.completed_at;
            const isUpdating = updatingId === stepInstance.id;
            const filteredAgents = agents.filter((a) =>
              stepInstance.step.step_type === "CLIENT"
                ? a.agent_type === "VERIFICATEUR"
                : a.agent_type === "CREATEUR"
            );

            return (
              <div
                key={stepInstance.id}
                className="rounded-lg bg-[#1e1f22] border border-[#363636] p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#f9f9f9]">
                        {stepInstance.step.label}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-medium uppercase">
                        Admin
                      </span>
                      <select
                        value={status}
                        onChange={(e) =>
                          handleStatusChange(
                            stepInstance,
                            e.target.value as ValidationStatus
                          )
                        }
                        disabled={isUpdating}
                        className={`${selectClass} ${statusConfig.pill}`}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {isUpdating && (
                        <i className="fa-solid fa-spinner fa-spin text-[#b7b7b7]" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#b7b7b7]">
                      <span>Assigné à</span>
                      <select
                        value={stepInstance.assigned_to ?? ""}
                        onChange={(e) =>
                          handleAssign(stepInstance, e.target.value)
                        }
                        disabled={isUpdating || loadingAgents}
                        className={selectClass}
                      >
                        <option value="">
                          {loadingAgents ? "…" : "Non assigné"}
                        </option>
                        {filteredAgents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      {stepInstance.assigned_to && (
                        <button
                          type="button"
                          onClick={() => handleAssign(stepInstance, "")}
                          disabled={isUpdating}
                          className="text-[10px] text-[#b7b7b7] hover:text-[#f9f9f9]"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                    {stepInstance.step.description && (
                      <p className="text-xs text-[#b7b7b7]">
                        {stepInstance.step.description}
                      </p>
                    )}
                    {isCompleted && stepInstance.completed_at && (
                      <p className="text-[10px] text-[#b7b7b7]">
                        Complété le{" "}
                        {new Date(stepInstance.completed_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {SIMPLIFIED_VALIDATION && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleValidate(stepInstance.id)}
                        disabled={validatingId === stepInstance.id}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {validatingId === stepInstance.id ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin" />
                            Validation…
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-check" />
                            Valider
                          </>
                        )}
                      </button>
                    )}
                    {status !== "APPROVED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStep(stepInstance);
                          setShowSendModal(true);
                        }}
                        className="px-3 py-2 rounded-lg bg-[#50b989] text-[#191a1d] text-xs font-medium hover:bg-[#50b989]/90 flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-paper-plane" />
                        Envoyer docs
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showSendModal && selectedStep && (
        <SendDocumentsModal
          dossierId={dossierId}
          productId={productId}
          stepInstanceId={selectedStep.id}
          stepName={selectedStep.step.label}
          onClose={() => {
            setShowSendModal(false);
            setSelectedStep(null);
          }}
          onSuccess={() => {
            fetchSteps();
            setShowSendModal(false);
            setSelectedStep(null);
          }}
        />
      )}
    </>
  );
}
