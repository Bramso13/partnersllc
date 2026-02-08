import Link from "next/link";
import { FormationParcours } from "@/components/dashboard/FormationParcours";
import type { FormationStepViewProps } from "../types";

/**
 * FormationStepView Component
 *
 * View for FORMATION steps.
 * Displays:
 * - Formation content (inline with FormationParcours or as link)
 * - Navigation card with "Passer à l'étape suivante" button
 */
export function FormationStepView({
  currentStep,
  formationFull,
  formationProgress,
  formationLoading,
  userId,
  isSubmitting,
  onCompleteFormationStep,
  onNavigateNext,
  onNavigatePrevious,
  currentStepIndex,
  totalSteps,
}: FormationStepViewProps) {
  if (!(currentStep?.formation_id || currentStep?.formation)) {
    return null;
  }

  return (
    <>
      {/* Formation Display */}
      <div className="mb-6">
        {formationLoading ? (
          <div className="rounded-xl border border-brand-border bg-brand-card p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-accent border-t-transparent" />
            <span className="ml-4 text-brand-text-secondary">
              Chargement de la formation...
            </span>
          </div>
        ) : formationFull ? (
          <div className="rounded-xl border border-brand-border bg-brand-card overflow-hidden shadow-lg">
            <FormationParcours
              formation={formationFull}
              progress={formationProgress}
              userId={userId ?? ""}
              embedded
            />
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-brand-border bg-brand-card">
            <h3 className="text-base font-semibold text-brand-text-primary mb-3">
              Formation à suivre
            </h3>
            {currentStep.formation ? (
              <Link
                href={`/dashboard/formation/${currentStep.formation.id}`}
                className="inline-flex items-center gap-2 text-brand-accent hover:underline font-medium"
              >
                {currentStep.formation.titre}
                <i className="fa-solid fa-arrow-right text-sm" />
              </Link>
            ) : (
              <span className="text-brand-text-secondary">
                Formation (ID: {currentStep.formation_id})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation Card */}
      <div className="bg-brand-card border border-brand-border rounded-lg p-6">
        <p className="text-sm text-brand-text-secondary mb-6">
          Consultez la formation ci-dessus puis passez à l&apos;étape suivante.
        </p>
        <div className="pt-6 border-t border-brand-border flex items-center justify-between">
          {currentStepIndex > 0 && (
            <button
              type="button"
              onClick={onNavigatePrevious}
              className="px-6 py-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Étape précédente
            </button>
          )}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCompleteFormationStep}
            className="ml-auto px-8 py-3.5 rounded-xl font-semibold text-base bg-brand-accent text-brand-dark-bg transition-all duration-300 hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Enregistrement...</span>
            ) : currentStepIndex === totalSteps - 1 ? (
              "Retour au tableau de bord"
            ) : (
              <>
                Passer à l&apos;étape suivante
                <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
