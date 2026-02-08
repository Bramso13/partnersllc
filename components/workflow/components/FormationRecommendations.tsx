import Link from "next/link";
import type { FormationRecommendationsProps } from "../types";

/**
 * FormationRecommendations Component
 *
 * Displays recommended formations for the current step.
 * Only shown for non-FORMATION steps that have associated formations.
 */
export function FormationRecommendations({
  formations,
  isFormationStep,
}: FormationRecommendationsProps) {
  if (isFormationStep || formations.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-lg border border-brand-border bg-brand-card">
      <h3 className="text-base font-semibold text-brand-text-primary mb-3">
        Formations recommandées pour cette étape
      </h3>
      <ul className="space-y-2">
        {formations.map((f) => (
          <li key={f.id}>
            <Link
              href={`/dashboard/formation/${f.id}`}
              className="text-brand-accent hover:underline font-medium"
            >
              {f.titre}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
