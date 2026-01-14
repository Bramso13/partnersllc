"use client";

import { DossierWithDetails } from "@/lib/dossiers";
import { ProductStep } from "@/lib/workflow";
import { useRouter } from "next/navigation";

interface ProgressCardProps {
  dossier: DossierWithDetails;
  productSteps?: ProductStep[];
}

export function ProgressCard({
  dossier,
  productSteps = [],
}: ProgressCardProps) {
  const router = useRouter();
  const progress = dossier.progress_percentage || 0;
  const statusLabel = getStatusLabel(dossier.status);
  const statusColor = getStatusColor(dossier.status);

  // Get all steps with their status and action buttons
  const steps = getSteps(dossier, productSteps);

  // Debug logging
  if (productSteps.length === 0) {
    console.warn("[ProgressCard] No product steps provided", {
      dossierId: dossier.id,
      productId: dossier.product_id,
      hasProduct: !!dossier.product,
    });
  }

  const handleStartStep = (stepId: string) => {
    // Navigate to dossier detail page with step_id parameter to open workflow on that step
    router.push(`/dashboard/dossier/${dossier.id}?step_id=${stepId}`);
  };

  return (
    <div className="col-span-8 bg-brand-dark-bg rounded-2xl p-6 card-hover">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary">
            Progression de votre dossier
          </h3>
          <p className="text-sm text-brand-text-secondary mt-1">
            {dossier.product?.name || "Dossier LLC"}
          </p>
        </div>
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusColor.bg} ${statusColor.text}`}
        >
          <div className="relative w-3 h-3 flex items-center justify-center">
            <span
              className={`absolute status-indicator ${statusColor.text}`}
            ></span>
            <span
              className={`relative w-1.5 h-1.5 ${statusColor.dot} rounded-full`}
            ></span>
          </div>
          <span className="text-sm font-medium">{statusLabel}</span>
        </div>
      </div>

      <div className="relative pt-1 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-brand-text-secondary">
            Progression globale
          </span>
          <span className="text-sm font-bold text-brand-text-primary">
            {progress}%
          </span>
        </div>
        <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-brand-dark-surface">
          <div
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#50B88A] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {steps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-brand-text-secondary mb-2">
              Aucune étape disponible
            </p>
            {productSteps.length === 0 && (
              <p className="text-xs text-brand-text-secondary/70">
                Les étapes seront affichées une fois le produit configuré
              </p>
            )}
          </div>
        ) : (
          steps.map((step, index) => (
            <div
              key={step.stepId || index}
              className={`flex items-center justify-between p-3 rounded-lg ${step.bgColor} ${step.border}`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div
                  className={`w-8 h-8 ${step.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  <i className={`${step.icon} ${step.iconColor} text-sm`}></i>
                </div>
                <p className="text-sm font-medium text-brand-text-primary">
                  {step.title}
                </p>
              </div>
              {step.showButton && (
                <button
                  onClick={() => handleStartStep(step.stepId!)}
                  disabled={!step.canStart}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${
                      step.canStart
                        ? "bg-brand-accent text-brand-dark-bg hover:opacity-90"
                        : "bg-brand-dark-surface text-brand-text-secondary opacity-50 cursor-not-allowed"
                    }`}
                  title={
                    !step.canStart
                      ? "Les étapes précédentes doivent être validées"
                      : undefined
                  }
                >
                  {step.buttonText}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    QUALIFICATION: "En qualification",
    FORM_SUBMITTED: "Formulaire soumis",
    NM_PENDING: "En attente",
    LLC_ACCEPTED: "Accepté",
    EIN_PENDING: "En attente EIN",
    BANK_PREPARATION: "Préparation bancaire",
    BANK_OPENED: "Banque ouverte",
    WAITING_48H: "En attente",
    CLOSED: "Terminé",
    ERROR: "Erreur",
  };
  return statusMap[status] || "En cours";
}

function getStatusColor(status: string) {
  if (
    status === "QUALIFICATION" ||
    status === "FORM_SUBMITTED" ||
    status === "NM_PENDING" ||
    status === "EIN_PENDING" ||
    status === "BANK_PREPARATION" ||
    status === "WAITING_48H"
  ) {
    return {
      bg: "bg-brand-warning/10",
      text: "text-brand-warning",
      dot: "bg-brand-warning",
    };
  }
  if (
    status === "CLOSED" ||
    status === "LLC_ACCEPTED" ||
    status === "BANK_OPENED"
  ) {
    return {
      bg: "bg-brand-success/10",
      text: "text-brand-success",
      dot: "bg-brand-success",
    };
  }
  if (status === "ERROR") {
    return {
      bg: "bg-brand-danger/10",
      text: "text-brand-danger",
      dot: "bg-brand-danger",
    };
  }
  return {
    bg: "bg-brand-warning/10",
    text: "text-brand-warning",
    dot: "bg-brand-warning",
  };
}

function getSteps(dossier: DossierWithDetails, productSteps: ProductStep[]) {
  // Create a map of step_id -> step_instance for quick lookup
  const stepInstanceMap = new Map(
    (dossier.step_instances || []).map((si) => [si.step_id, si])
  );

  // If no product steps, return empty array
  if (!productSteps || productSteps.length === 0) {
    console.warn("[getSteps] No product steps provided", {
      productStepsLength: productSteps?.length || 0,
    });
    return [];
  }

  // Debug: log product steps structure
  console.log("[getSteps] Processing product steps", {
    count: productSteps.length,
    firstStep: productSteps[0]
      ? {
          id: productSteps[0].id,
          step_id: productSteps[0].step_id,
          hasStep: !!productSteps[0].step,
          stepLabel: productSteps[0].step?.label || "NO LABEL",
        }
      : null,
  });

  // Return all product steps with their status
  return productSteps
    .filter((productStep) => {
      // Filter out steps without step data
      if (!productStep.step) {
        console.warn("[getSteps] Product step missing step data", {
          productStepId: productStep.id,
          stepId: productStep.step_id,
        });
        return false;
      }
      return true;
    })
    .map((productStep, index) => {
      const stepInstance = stepInstanceMap.get(productStep.step_id);
      const validationStatus = (stepInstance as any)?.validation_status;

      // Check if previous step has been submitted
      const canStart = checkPreviousStepSubmitted(
        productSteps,
        stepInstanceMap,
        index
      );

      // Determine step status
      if (!stepInstance) {
        // No step instance - step not started yet
        return {
          stepId: productStep.step_id,
          title: productStep.step?.label || "Étape sans nom",
          bgColor: "bg-brand-dark-surface",
          border: "",
          iconBg: "bg-brand-text-secondary/20",
          icon: "fa-solid fa-circle",
          iconColor: "text-brand-text-secondary",
          showButton: true,
          canStart,
          buttonText: "Commencer",
        };
      }

      const isCompleted =
        stepInstance.completed_at !== null || validationStatus === "APPROVED";
      const isInProgress =
        !isCompleted &&
        stepInstance.started_at !== null &&
        stepInstance.id === dossier.current_step_instance_id;
      const isRejected = validationStatus === "REJECTED";
      const isSubmitted =
        validationStatus === "SUBMITTED" || validationStatus === "UNDER_REVIEW";

      if (isCompleted) {
        return {
          stepId: productStep.step_id,
          title: productStep.step?.label || "Étape sans nom",
          bgColor: "bg-brand-success/10",
          border: "",
          iconBg: "bg-brand-success/20",
          icon: "fa-solid fa-check",
          iconColor: "text-brand-success",
          showButton: false,
          canStart: false,
          buttonText: "",
        };
      } else if (isRejected) {
        return {
          stepId: productStep.step_id,
          title: productStep.step?.label || "Étape sans nom",
          bgColor: "bg-brand-danger/10",
          border: "border border-brand-danger/20",
          iconBg: "bg-brand-danger/20",
          icon: "fa-solid fa-xmark",
          iconColor: "text-brand-danger",
          showButton: true,
          canStart: true, // Can always restart rejected steps
          buttonText: "Corriger",
        };
      } else if (isSubmitted) {
        return {
          stepId: productStep.step_id,
          title: productStep.step?.label || "Étape sans nom",
          bgColor: "bg-brand-warning/10",
          border: "border border-brand-warning/20",
          iconBg: "bg-brand-warning/20",
          icon: "fa-solid fa-clock",
          iconColor: "text-brand-warning",
          showButton: false,
          canStart: false,
          buttonText: "",
        };
      } else if (isInProgress) {
        return {
          stepId: productStep.step_id,
          title: productStep.step?.label || "Étape sans nom",
          bgColor: "bg-brand-warning/10",
          border: "border border-brand-warning/20",
          iconBg: "bg-brand-warning/20",
          icon: "fa-solid fa-spinner fa-spin",
          iconColor: "text-brand-warning",
          showButton: true,
          canStart: true,
          buttonText: "Continuer",
        };
      } else {
        // DRAFT status
        return {
          stepId: productStep.step_id,
          title: productStep.step?.label || "Étape sans nom",
          bgColor: "bg-brand-dark-surface",
          border: "",
          iconBg: "bg-brand-text-secondary/20",
          icon: "fa-solid fa-circle",
          iconColor: "text-brand-text-secondary",
          showButton: true,
          canStart,
          buttonText: "Commencer",
        };
      }
    });
}

function checkPreviousStepSubmitted(
  productSteps: ProductStep[],
  stepInstanceMap: Map<string, any>,
  currentIndex: number
): boolean {
  // First step can always be started
  if (currentIndex === 0) {
    return true;
  }

  // Check if the previous step (immediately before) has been submitted
  const prevIndex = currentIndex - 1;
  const prevProductStep = productSteps[prevIndex];
  const prevStepInstance = stepInstanceMap.get(prevProductStep.step_id);

  // Previous step must exist and have been submitted (not in DRAFT state)
  if (!prevStepInstance) {
    // Previous step not started
    return false;
  }

  const prevValidationStatus = prevStepInstance.validation_status;

  // Step is considered submitted if it has a validation_status that is not DRAFT or null
  // This includes: SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
  return prevValidationStatus !== null && prevValidationStatus !== "DRAFT";
}

function checkPreviousStepsApproved(
  productSteps: ProductStep[],
  stepInstanceMap: Map<string, any>,
  currentIndex: number
): boolean {
  // First step can always be started
  if (currentIndex === 0) {
    return true;
  }

  // Check all previous steps are approved
  for (let i = 0; i < currentIndex; i++) {
    const prevProductStep = productSteps[i];
    const prevStepInstance = stepInstanceMap.get(prevProductStep.step_id);

    if (!prevStepInstance) {
      // Previous step not started
      return false;
    }

    const prevValidationStatus = prevStepInstance.validation_status;
    const prevCompleted = prevStepInstance.completed_at !== null;

    // Previous step must be APPROVED or completed
    if (!prevCompleted && prevValidationStatus !== "APPROVED") {
      return false;
    }
  }

  return true;
}
