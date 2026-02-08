import type { StepProgressBarProps } from "../types";

/**
 * StepProgressBar Component
 *
 * Displays workflow progress with:
 * - Step header (title + admin badge + step counter)
 * - Optional description
 * - Linear progress bar
 * - Step navigation circles with status indicators
 */
export function StepProgressBar({
  currentStepIndex,
  totalSteps,
  currentStepLabel,
  currentStepDescription,
  isAdminStep,
  productSteps,
  getNextStepAvailableAt,
}: StepProgressBarProps) {
  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-brand-text-primary">
            {currentStepLabel}
          </h2>
          {isAdminStep && (
            <span className="px-2 py-1 bg-brand-warning/20 text-brand-warning rounded text-xs font-medium">
              Action admin
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-brand-text-secondary">
          Étape {currentStepIndex + 1} sur {totalSteps}
        </span>
      </div>

      {/* Description */}
      {currentStepDescription && (
        <p className="text-brand-text-secondary mb-4">
          {currentStepDescription}
        </p>
      )}

      {/* Linear Progress Bar */}
      <div className="w-full bg-brand-dark-surface rounded-full h-2">
        <div
          className="bg-brand-accent h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
        ></div>
      </div>

      {/* Step Navigation Circles */}
      {totalSteps > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {productSteps.map((step, index) => {
            const isApproved = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            // TIMER: step after a TIMER is locked until delay elapsed
            const nextAvailableAt = getNextStepAvailableAt(index);
            const isLocked =
              nextAvailableAt != null && Date.now() < nextAvailableAt;

            return (
              <div
                key={step.id}
                className={`flex items-center ${
                  isApproved
                    ? "text-brand-success"
                    : isCurrent
                      ? "text-brand-accent"
                      : "text-brand-text-secondary"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all ${
                    isApproved
                      ? "bg-brand-success border-brand-success text-white"
                      : isCurrent
                        ? "bg-brand-accent border-brand-accent text-brand-dark-bg"
                        : "bg-transparent border-brand-dark-border"
                  }`}
                >
                  {isApproved ? (
                    <i className="fa-solid fa-check text-xs"></i>
                  ) : isLocked ? (
                    <i className="fa-solid fa-lock text-xs"></i>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      isApproved ? "bg-brand-success" : "bg-brand-dark-border"
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
