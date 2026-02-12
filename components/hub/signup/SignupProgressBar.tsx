"use client";

interface SignupProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

/**
 * Barre de progression du tunnel d'inscription (ex: 2/4 = 50%).
 */
export function SignupProgressBar({
  currentStep,
  totalSteps,
  className = "",
}: SignupProgressBarProps) {
  const percent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-text-secondary">
        <span>
          Étape {currentStep} sur {totalSteps}
        </span>
        <span>{Math.round(percent)} %</span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
