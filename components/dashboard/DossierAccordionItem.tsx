"use client";

import { useState } from "react";
import type { DossierWithDetails } from "@/types/dossiers";
import { ProductStep } from "@/lib/workflow";
import Link from "next/link";

interface AdvisorInfo {
  id: string | null;
  name: string;
  email: string;
  role: string;
}

interface DossierAccordionItemProps {
  dossier: DossierWithDetails;
  productSteps: ProductStep[];
  advisor?: AdvisorInfo;
  isExpanded: boolean;
  onToggle: () => void;
}

export function DossierAccordionItem({
  dossier,
  productSteps,
  advisor,
  isExpanded,
  onToggle,
}: DossierAccordionItemProps) {
  const progress = dossier.progress_percentage || 0;
  const statusConfig = getStatusConfig(dossier.status);
  const currentStep = getCurrentStep(dossier, productSteps);
  const timelineEvents = getCompactTimeline(dossier);

  // Estimated completion (2 days from creation for now)
  const estimatedDate = dossier.completed_at
    ? null
    : new Date(
        new Date(dossier.created_at).getTime() + 2 * 24 * 60 * 60 * 1000
      );

  return (
    <div className="bg-brand-dark-bg rounded-2xl overflow-hidden transition-all duration-300">
      {/* Header - Always visible (collapsed view) */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-brand-dark-surface/50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Progress circle */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-brand-dark-surface"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progress * 1.256} 125.6`}
                className="text-[#50B88A]"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-text-primary">
              {progress}%
            </span>
          </div>

          {/* Product name and current step */}
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-semibold text-brand-text-primary truncate">
              {dossier.product?.name || "Dossier"}
            </h3>
            <p className="text-sm text-brand-text-secondary truncate">
              {currentStep || "Aucune étape en cours"}
            </p>
          </div>

          {/* Status badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text} flex-shrink-0`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
            ></span>
            <span className="text-xs font-medium">{statusConfig.label}</span>
          </div>
        </div>

        {/* Chevron */}
        <i
          className={`fa-solid fa-chevron-down text-brand-text-secondary ml-4 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        ></i>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-brand-dark-border">
          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            {/* Advisor */}
            <div className="bg-brand-dark-surface rounded-xl p-3">
              <p className="text-xs text-brand-text-secondary mb-1">
                Conseiller
              </p>
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 p-1.5">
                  <img
                    src="/logo_partnersllc_blanc.png"
                    alt="Partners LLC"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-sm font-medium text-brand-text-primary truncate">
                  {advisor?.name || "Sophie Martin"}
                </span>
              </div>
            </div>

            {/* Estimated date */}
            <div className="bg-brand-dark-surface rounded-xl p-3">
              <p className="text-xs text-brand-text-secondary mb-1">
                Estimation
              </p>
              <p className="text-sm font-medium text-brand-text-primary">
                {estimatedDate
                  ? estimatedDate.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Terminé"}
              </p>
            </div>

            {/* Steps progress */}
            <div className="bg-brand-dark-surface rounded-xl p-3">
              <p className="text-xs text-brand-text-secondary mb-1">Étapes</p>
              <p className="text-sm font-medium text-brand-text-primary">
                {dossier.completed_steps_count || 0} /{" "}
                {dossier.total_steps_count || productSteps.length}
              </p>
            </div>
          </div>

          {/* Compact timeline */}
          <div className="bg-brand-dark-surface rounded-xl p-3">
            <p className="text-xs text-brand-text-secondary mb-2">
              Dernières activités
            </p>
            <div className="space-y-2">
              {timelineEvents.slice(0, 3).map((event, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full ${event.iconBg} flex items-center justify-center flex-shrink-0`}
                  >
                    <i
                      className={`${event.icon} ${event.iconColor} text-xs`}
                    ></i>
                  </div>
                  <span className="text-sm text-brand-text-primary truncate flex-1">
                    {event.title}
                  </span>
                  {event.date && (
                    <span className="text-xs text-brand-text-secondary flex-shrink-0">
                      {event.date}
                    </span>
                  )}
                </div>
              ))}
              {timelineEvents.length === 0 && (
                <p className="text-sm text-brand-text-secondary">
                  Aucune activité récente
                </p>
              )}
            </div>
          </div>

          {/* Steps preview */}
          <div className="bg-brand-dark-surface rounded-xl p-3">
            <p className="text-xs text-brand-text-secondary mb-2">
              Progression des étapes
            </p>
            <div className="flex gap-1">
              {productSteps.slice(0, 6).map((step, index) => {
                const stepStatus = getStepStatus(dossier, step);
                return (
                  <div
                    key={step.step_id}
                    className={`flex-1 h-2 rounded-full ${stepStatus.bg}`}
                    title={step.step?.label || `Étape ${index + 1}`}
                  />
                );
              })}
              {productSteps.length > 6 && (
                <span className="text-xs text-brand-text-secondary ml-1">
                  +{productSteps.length - 6}
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          <Link
            href={`/dashboard/dossier/${dossier.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-accent text-brand-dark-bg rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <span>Voir le détail du dossier</span>
            <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      )}
    </div>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; dot: string }
  > = {
    QUALIFICATION: {
      label: "Qualification",
      bg: "bg-brand-warning/10",
      text: "text-brand-warning",
      dot: "bg-brand-warning",
    },
    FORM_SUBMITTED: {
      label: "Soumis",
      bg: "bg-brand-warning/10",
      text: "text-brand-warning",
      dot: "bg-brand-warning",
    },
    NM_PENDING: {
      label: "En attente",
      bg: "bg-brand-warning/10",
      text: "text-brand-warning",
      dot: "bg-brand-warning",
    },
    LLC_ACCEPTED: {
      label: "Accepté",
      bg: "bg-brand-success/10",
      text: "text-brand-success",
      dot: "bg-brand-success",
    },
    EIN_PENDING: {
      label: "EIN en cours",
      bg: "bg-brand-warning/10",
      text: "text-brand-warning",
      dot: "bg-brand-warning",
    },
    BANK_PREPARATION: {
      label: "Banque",
      bg: "bg-brand-warning/10",
      text: "text-brand-warning",
      dot: "bg-brand-warning",
    },
    BANK_OPENED: {
      label: "Banque ouverte",
      bg: "bg-brand-success/10",
      text: "text-brand-success",
      dot: "bg-brand-success",
    },
    CLOSED: {
      label: "Terminé",
      bg: "bg-brand-success/10",
      text: "text-brand-success",
      dot: "bg-brand-success",
    },
    ERROR: {
      label: "Erreur",
      bg: "bg-brand-danger/10",
      text: "text-brand-danger",
      dot: "bg-brand-danger",
    },
  };

  return (
    configs[status] || {
      label: "En cours",
      bg: "bg-brand-warning/10",
      text: "text-brand-warning",
      dot: "bg-brand-warning",
    }
  );
}

function getCurrentStep(
  dossier: DossierWithDetails,
  productSteps: ProductStep[]
): string | null {
  if (!dossier.current_step_instance_id || !dossier.step_instances) {
    return productSteps[0]?.step?.label || null;
  }

  const currentInstance = dossier.step_instances.find(
    (si) => si.id === dossier.current_step_instance_id
  );

  return currentInstance?.step?.label || null;
}

function getCompactTimeline(dossier: DossierWithDetails) {
  if (!dossier.step_instances || dossier.step_instances.length === 0) {
    return [];
  }

  return dossier.step_instances
    .filter((si) => si.started_at)
    .sort((a, b) => {
      const aDate = a.completed_at || a.started_at || "";
      const bDate = b.completed_at || b.started_at || "";
      return new Date(bDate).getTime() - new Date(aDate).getTime(); // Most recent first
    })
    .map((si) => {
      const isCompleted =
        si.completed_at !== null || si.validation_status === "APPROVED";
      const isRejected = si.validation_status === "REJECTED";

      return {
        title: si.step?.label || "Étape",
        date:
          si.completed_at || si.started_at
            ? new Date(si.completed_at || si.started_at!).toLocaleDateString(
                "fr-FR",
                { day: "numeric", month: "short" }
              )
            : undefined,
        icon: isRejected
          ? "fa-solid fa-xmark"
          : isCompleted
            ? "fa-solid fa-check"
            : "fa-solid fa-spinner fa-spin",
        iconBg: isRejected
          ? "bg-brand-danger/20"
          : isCompleted
            ? "bg-brand-success/20"
            : "bg-brand-warning/20",
        iconColor: isRejected
          ? "text-brand-danger"
          : isCompleted
            ? "text-brand-success"
            : "text-brand-warning",
      };
    });
}

function getStepStatus(dossier: DossierWithDetails, productStep: ProductStep) {
  const stepInstance = dossier.step_instances?.find(
    (si) => si.step_id === productStep.step_id
  );

  if (!stepInstance) {
    return { bg: "bg-brand-dark-border" }; // Not started
  }

  const isCompleted =
    stepInstance.completed_at !== null ||
    stepInstance.validation_status === "APPROVED";
  const isRejected = stepInstance.validation_status === "REJECTED";
  const isInProgress =
    stepInstance.id === dossier.current_step_instance_id &&
    !isCompleted &&
    !isRejected;

  if (isCompleted) return { bg: "bg-brand-success" };
  if (isRejected) return { bg: "bg-brand-danger" };
  if (isInProgress) return { bg: "bg-brand-warning" };

  return { bg: "bg-brand-dark-border" };
}
