import Link from "next/link";
import type { FormationRecommendationsProps } from "../types";

/**
 * FormationRecommendations Component
 *
 * Displays recommended formations for the current step (parcours + custom, Story 12.4 + 12.5).
 * Only shown for non-FORMATION steps that have at least one item.
 */
export function FormationRecommendations({
  formations,
  stepFormationItems,
  isFormationStep,
}: FormationRecommendationsProps) {
  const items = stepFormationItems?.length ? stepFormationItems : formations.map((f) => ({
    type: "formation" as const,
    id: f.id,
    titre: f.titre,
    url: `/dashboard/formation/${f.id}`,
  }));
  if (isFormationStep || items.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-lg border border-brand-border bg-brand-card">
      <h3 className="text-base font-semibold text-brand-text-primary mb-3">
        Formations recommandées pour cette étape
      </h3>
      <ul className="space-y-2">
        {items.map((item) =>
          item.type === "formation" ? (
            <li key={`formation-${item.id}`}>
              <Link
                href={item.url}
                className="text-brand-accent hover:underline font-medium"
              >
                {item.titre}
              </Link>
            </li>
          ) : (
            <li key={`custom-${item.id}`}>
              <Link
                href={item.url}
                className="text-brand-accent hover:underline font-medium"
              >
                {item.title}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
