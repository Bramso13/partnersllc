import type { ClientStepReadOnlyProps } from "../types";

/**
 * ClientStepReadOnly Component
 *
 * Read-only view for CLIENT steps that are:
 * - SUBMITTED (waiting for review)
 * - UNDER_REVIEW (being reviewed)
 * - APPROVED (validated)
 *
 * Shows status icon, message, and navigation buttons.
 */
export function ClientStepReadOnly({
  validationStatus,
  onNavigateNext,
  onNavigatePrevious,
  currentStepIndex,
  totalSteps,
}: ClientStepReadOnlyProps) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-lg p-8">
      <div className="text-center mb-6">
        {validationStatus === "APPROVED" ? (
          <>
            <div className="w-16 h-16 bg-brand-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check-circle text-brand-success text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
              Étape validée avec succès
            </h3>
            <p className="text-brand-text-secondary">
              Cette étape a été approuvée par notre équipe. Les informations ne
              peuvent plus être modifiées.
            </p>
          </>
        ) : validationStatus === "UNDER_REVIEW" ||
          validationStatus === "SUBMITTED" ? (
          <>
            <div className="w-16 h-16 bg-brand-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-hourglass-half text-brand-warning text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
              Étape en cours de vérification
            </h3>
            <p className="text-brand-text-secondary mb-4">
              Votre soumission est actuellement examinée par notre équipe. Vous
              recevrez une notification dès que la vérification sera terminée.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-dark-surface rounded-lg text-sm text-brand-text-secondary">
              <i className="fas fa-lightbulb text-brand-accent"></i>
              <span>
                Vous pouvez continuer avec les étapes suivantes pendant ce temps
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-brand-dark-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-info-circle text-brand-text-secondary text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
              Étape en lecture seule
            </h3>
            <p className="text-brand-text-secondary">
              Cette étape ne peut pas être modifiée pour le moment.
            </p>
          </>
        )}
      </div>

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
          onClick={onNavigateNext}
          className="ml-auto px-8 py-3.5 rounded-xl font-semibold text-base
            transition-all duration-300
            flex items-center justify-center gap-2
            bg-brand-accent text-brand-dark-bg hover:opacity-90 hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(0,240,255,0.3)]"
        >
          {currentStepIndex === totalSteps - 1 ? (
            "Retour au tableau de bord"
          ) : (
            <>
              Étape suivante
              <i className="fa-solid fa-arrow-right"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
