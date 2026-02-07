"use client";

import Link from "next/link";
import type { StepInstanceWithDetails } from "@/types/agents";

interface CurrentStepsSectionProps {
  steps: StepInstanceWithDetails[];
}

export function CurrentStepsSection({ steps }: CurrentStepsSectionProps) {
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

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-spinner text-blue-400"></i>
          <h3 className="font-semibold text-brand-text-primary">Ce qu&apos;il fait</h3>
          <span className="ml-auto text-xs text-brand-text-secondary bg-brand-bg px-2 py-1 rounded-full">
            {steps.length}
          </span>
        </div>
        <p className="text-xs text-brand-text-secondary mt-1">
          Tâches en cours assignées à cet agent
        </p>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {steps.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-brand-bg mx-auto flex items-center justify-center mb-3">
              <i className="fa-solid fa-inbox text-brand-text-secondary"></i>
            </div>
            <p className="text-sm text-brand-text-secondary">
              Aucune tâche en cours
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step) => (
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
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full flex-shrink-0
                    ${step.step.step_type === "CLIENT" 
                      ? "bg-blue-500/20 text-blue-400" 
                      : "bg-purple-500/20 text-purple-400"
                    }
                  `}>
                    {step.step.step_type}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-brand-text-secondary mb-2">
                  <i className="fa-solid fa-tag"></i>
                  <span className="truncate">
                    {step.step.label || step.step.code || "Étape"}
                  </span>
                </div>

                {step.dossier.product_name && (
                  <div className="flex items-center gap-2 text-xs text-brand-text-secondary mb-2">
                    <i className="fa-solid fa-box"></i>
                    <span className="truncate">{step.dossier.product_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-text-secondary">
                    Assigné {formatRelativeTime(step.started_at || step.created_at)}
                  </span>
                  <Link
                    href={`/admin/dossiers/${step.dossier_id}`}
                    className="text-brand-gold hover:underline"
                  >
                    Voir →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
