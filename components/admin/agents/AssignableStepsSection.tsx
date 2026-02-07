"use client";

import { useState } from "react";
import Link from "next/link";
import type { StepInstanceWithDetails } from "@/types/agents";

interface AssignableStepsSectionProps {
  steps: StepInstanceWithDetails[];
  agentName: string;
  onAssignStep: (stepInstanceId: string) => Promise<void>;
}

export function AssignableStepsSection({
  steps,
  agentName,
  onAssignStep,
}: AssignableStepsSectionProps) {
  const [assigningStepId, setAssigningStepId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "—";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const handleAssign = async (stepInstanceId: string) => {
    setAssigningStepId(stepInstanceId);
    setSuccessMessage(null);
    try {
      await onAssignStep(stepInstanceId);
      setSuccessMessage("Tâche assignée avec succès !");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setAssigningStepId(null);
    }
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-list-check text-amber-400"></i>
          <h3 className="font-semibold text-brand-text-primary">Ce qu&apos;il devra faire</h3>
          <span className="ml-auto text-xs text-brand-text-secondary bg-brand-bg px-2 py-1 rounded-full">
            {steps.length}
          </span>
        </div>
        <p className="text-xs text-brand-text-secondary mt-1">
          Tâches disponibles à assigner à {agentName}
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mx-4 mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
          <i className="fa-solid fa-check mr-2"></i>
          {successMessage}
        </div>
      )}

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {steps.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-brand-bg mx-auto flex items-center justify-center mb-3">
              <i className="fa-solid fa-clipboard-check text-brand-text-secondary"></i>
            </div>
            <p className="text-sm text-brand-text-secondary">
              Aucune tâche disponible à assigner
            </p>
            <p className="text-xs text-brand-text-secondary mt-1">
              Toutes les tâches compatibles sont déjà assignées
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step) => {
              const isAssigning = assigningStepId === step.id;
              const isAlreadyAssigned = step.assigned_to !== null;

              return (
                <div
                  key={step.id}
                  className="bg-brand-bg rounded-lg p-3 hover:bg-brand-bg/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/dossiers/${step.dossier_id}`}
                        className="text-sm font-medium text-brand-text-primary hover:text-brand-gold truncate block"
                      >
                        {step.dossier.client_name}
                      </Link>
                      {step.dossier.dossier_number && (
                        <p className="text-xs text-brand-text-secondary">
                          #{step.dossier.dossier_number}
                        </p>
                      )}
                    </div>
                    {isAlreadyAssigned ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 flex-shrink-0">
                        Réassigner
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex-shrink-0">
                        Non assigné
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-brand-text-secondary mb-2">
                    <i className="fa-solid fa-tag"></i>
                    <span className="truncate">
                      {step.step.label || step.step.code || "Étape"}
                    </span>
                    <span className={`
                      px-1.5 py-0.5 rounded text-[10px]
                      ${step.step.step_type === "CLIENT" 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "bg-purple-500/20 text-purple-400"
                      }
                    `}>
                      {step.step.step_type}
                    </span>
                  </div>

                  {step.dossier.product_name && (
                    <div className="flex items-center gap-2 text-xs text-brand-text-secondary mb-2">
                      <i className="fa-solid fa-box"></i>
                      <span className="truncate">{step.dossier.product_name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-brand-text-secondary mb-3">
                    <i className="fa-regular fa-clock"></i>
                    <span>Créé {formatRelativeTime(step.created_at)}</span>
                  </div>

                  {/* Assign button */}
                  <button
                    onClick={() => handleAssign(step.id)}
                    disabled={isAssigning}
                    className={`
                      w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors
                      flex items-center justify-center gap-2
                      ${isAssigning
                        ? "bg-brand-gold/50 text-brand-bg cursor-not-allowed"
                        : "bg-brand-gold text-brand-bg hover:bg-brand-gold/90"
                      }
                    `}
                  >
                    {isAssigning ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        Assignation...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-user-plus"></i>
                        {isAlreadyAssigned ? `Réassigner à ${agentName}` : `Assigner à ${agentName}`}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
