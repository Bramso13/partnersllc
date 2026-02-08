import type { TimerBlockMessageProps } from "../types";

/**
 * TimerBlockMessage Component
 *
 * Displays a warning when the next step is blocked by a TIMER delay.
 * Shows remaining time until the step becomes available.
 */
export function TimerBlockMessage({
  isBlocked,
  remainingMinutes,
}: TimerBlockMessageProps) {
  if (!isBlocked) return null;

  return (
    <div className="mb-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
      <div className="flex items-center gap-2 text-amber-400">
        <i className="fa-solid fa-clock text-lg" />
        <span className="text-sm font-medium">
          Prochaine étape disponible dans {remainingMinutes} min
        </span>
      </div>
      <p className="text-xs text-brand-text-secondary mt-1">
        Un délai de réflexion est en cours après l&apos;étape précédente.
      </p>
    </div>
  );
}
