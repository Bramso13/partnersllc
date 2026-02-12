"use client";

import Link from "next/link";
import type { Formation, UserFormationProgress } from "@/types/formations";

interface FormationCardProps {
  formation: Formation;
  progress?: UserFormationProgress | null;
  totalElements?: number;
}

export function FormationCard({
  formation,
  progress,
  totalElements = 0,
}: FormationCardProps) {
  // Calculate progress percentage
  const completedCount = progress?.completed_element_ids?.length || 0;
  const progressPercentage =
    totalElements > 0 ? Math.round((completedCount / totalElements) * 100) : 0;

  return (
    <Link
      href={`/dashboard/formation/${formation.id}`}
      className="block bg-surface border border-border rounded-xl overflow-hidden transition-all hover:border-accent/50 hover:shadow-lg group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-accent/10 to-accent/5 overflow-hidden">
        {(formation.vignette_url || formation.vignette_path) ? (
          <img
            src={
              formation.vignette_url
                ? formation.vignette_url
                : `/api/formations/vignette?path=${encodeURIComponent(formation.vignette_path!)}`
            }
            alt={formation.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fa-solid fa-graduation-cap text-6xl text-accent/30"></i>
          </div>
        )}

        {/* Progress Badge */}
        {totalElements > 0 && (
          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
            {progressPercentage === 100 ? (
              <span className="flex items-center gap-1.5 text-green-500">
                <i className="fa-solid fa-check-circle"></i>
                Terminé
              </span>
            ) : completedCount > 0 ? (
              <span className="text-accent">
                {completedCount}/{totalElements} vus
              </span>
            ) : (
              <span className="text-text-secondary">
                {totalElements} élément{totalElements > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
          {formation.titre}
        </h3>

        {formation.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-4">
            {formation.description}
          </p>
        )}

        {/* Progress Bar */}
        {totalElements > 0 && progressPercentage > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Progression</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-accent group-hover:text-accent/80 transition-colors">
            {completedCount > 0 && progressPercentage < 100
              ? "Continuer la formation"
              : progressPercentage === 100
              ? "Revoir la formation"
              : "Commencer la formation"}
          </span>
          <i className="fa-solid fa-arrow-right text-accent group-hover:translate-x-1 transition-transform"></i>
        </div>
      </div>
    </Link>
  );
}
