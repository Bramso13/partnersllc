"use client";

import { useState, useEffect } from "react";
import { SendDocumentsModal } from "./SendDocumentsModal";

type ValidationStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

const STATUS_OPTIONS: { value: ValidationStatus; label: string; color: string }[] = [
  { value: "DRAFT", label: "Brouillon", color: "bg-gray-500/20 text-gray-400" },
  { value: "SUBMITTED", label: "Soumis", color: "bg-blue-500/20 text-blue-400" },
  { value: "UNDER_REVIEW", label: "En révision", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "APPROVED", label: "Approuvé", color: "bg-green-500/20 text-green-400" },
  { value: "REJECTED", label: "Rejeté", color: "bg-red-500/20 text-red-400" },
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

export function AdminStepsSection({
  dossierId,
  productId,
}: AdminStepsSectionProps) {
  const [adminSteps, setAdminSteps] = useState<AdminStepInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedStepInstance, setSelectedStepInstance] =
    useState<AdminStepInstance | null>(null);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);
  const [agents, setAgents] = useState<
    { id: string; name: string; email: string; agent_type: "VERIFICATEUR" | "CREATEUR" }[]
  >([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const fetchAdminSteps = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/admin-steps`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des étapes admin");
      }

      const data = await response.json();
      setAdminSteps(data.stepInstances || []);
    } catch (err) {
      console.error("Error fetching admin steps:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminSteps();
  }, [dossierId]);

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const response = await fetch("/api/admin/agents");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des agents");
      }
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSendDocuments = (stepInstance: AdminStepInstance) => {
    setSelectedStepInstance(stepInstance);
    setShowSendModal(true);
  };

  const handleModalSuccess = () => {
    fetchAdminSteps();
    setShowSendModal(false);
    setSelectedStepInstance(null);
  };

  const handleModalClose = () => {
    setShowSendModal(false);
    setSelectedStepInstance(null);
  };

  const handleStatusChange = async (stepInstance: AdminStepInstance, newStatus: ValidationStatus) => {
    try {
      setUpdatingStepId(stepInstance.id);

      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/steps/${stepInstance.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut");
      }

      await fetchAdminSteps();
    } catch (err) {
      console.error("Error updating step status:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handleAssignChange = async (stepInstance: AdminStepInstance, agentId: string) => {
    try {
      setUpdatingStepId(stepInstance.id);

      const response = await fetch(
        `/api/admin/step-instances/${stepInstance.id}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: agentId === "" ? null : agentId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Erreur lors de l'assignation");
      }

      await fetchAdminSteps();
    } catch (err) {
      console.error("Error assigning step:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setUpdatingStepId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchAdminSteps}
            className="text-brand-accent hover:text-brand-accent-hover"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (adminSteps.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Étapes Admin
          </h2>
          <button
            onClick={fetchAdminSteps}
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            title="Actualiser"
          >
            <i className="fa-solid fa-refresh"></i>
          </button>
        </div>

        <div className="space-y-4">
          {adminSteps.map((stepInstance) => {
            const isCompleted = !!stepInstance.completed_at;
            const currentStatus = stepInstance.validation_status || "DRAFT";
            const statusConfig = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];
            const isUpdating = updatingStepId === stepInstance.id;

            return (
              <div
                key={stepInstance.id}
                className="border border-brand-border rounded-lg p-4 bg-brand-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-brand-text-primary">
                          {stepInstance.step.label}
                        </h3>
                        <span className="px-2 py-1 bg-brand-warning/20 text-brand-warning rounded text-xs font-medium">
                          Admin
                        </span>
                      </div>
                      {/* Status dropdown */}
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          handleStatusChange(
                            stepInstance,
                            e.target.value as ValidationStatus
                          )
                        }
                        disabled={isUpdating}
                        className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${statusConfig.color}`}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            className="bg-[#191A1D] text-white"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {isUpdating && (
                        <i className="fa-solid fa-spinner fa-spin text-brand-text-secondary"></i>
                      )}
                    </div>
                    {/* Assignation agent */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-brand-text-secondary">
                      <span className="font-medium">Assigné à :</span>
                      <select
                        value={stepInstance.assigned_to || ""}
                        onChange={(e) =>
                          handleAssignChange(stepInstance, e.target.value)
                        }
                        disabled={isUpdating || loadingAgents}
                        className="px-2 py-1 rounded border border-brand-border bg-[#191A1D] text-xs text-brand-text-primary"
                      >
                        <option value="">
                          {loadingAgents ? "Chargement..." : "Non assigné"}
                        </option>
                        {agents
                          .filter((agent) =>
                            stepInstance.step.step_type === "CLIENT"
                              ? agent.agent_type === "VERIFICATEUR"
                              : agent.agent_type === "CREATEUR"
                          )
                          .map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} ({agent.email})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAssignChange(stepInstance, "")}
                        disabled={isUpdating || stepInstance.assigned_to === null}
                        className="inline-flex items-center gap-1 text-[11px] text-brand-text-secondary hover:text-brand-text-primary disabled:opacity-40"
                      >
                        <i className="fa-regular fa-circle-xmark"></i>
                        <span>Retirer l&apos;assignation</span>
                      </button>
                    </div>
                    {stepInstance.step.description && (
                      <p className="text-sm text-brand-text-secondary mb-2">
                        {stepInstance.step.description}
                      </p>
                    )}
                    {isCompleted && stepInstance.completed_at && (
                      <p className="text-xs text-brand-text-secondary">
                        Complété le:{" "}
                        {new Date(stepInstance.completed_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    )}
                  </div>
                  {currentStatus !== "APPROVED" && (
                    <button
                      onClick={() => handleSendDocuments(stepInstance)}
                      className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium ml-4"
                    >
                      <i className="fas fa-paper-plane mr-2"></i>
                      Envoyer des documents
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Send Documents Modal */}
      {showSendModal && selectedStepInstance && (
        <SendDocumentsModal
          dossierId={dossierId}
          productId={productId}
          stepInstanceId={selectedStepInstance.id}
          stepName={selectedStepInstance.step.label}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}
