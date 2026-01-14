"use client";

import { DossierWithDetails } from "@/lib/dossiers";
import { ProductStep } from "@/lib/workflow";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DossierInfoSectionProps {
  dossier: DossierWithDetails;
  productSteps: ProductStep[];
}

export function DossierInfoSection({
  dossier,
  productSteps,
}: DossierInfoSectionProps) {
  const progressPercentage = dossier.progress_percentage || 0;
  const completedSteps = dossier.completed_steps_count || 0;
  const totalSteps = dossier.total_steps_count || 0;

  return (
    <div className="bg-brand-surface-light border border-brand-stroke rounded-lg p-6">
      <h2 className="text-xl font-semibold text-brand-text-primary mb-6">
        Informations du dossier
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              ID du dossier
            </label>
            <p className="text-brand-text-primary font-mono text-sm">
              {dossier.id}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              ID utilisateur
            </label>
            <p className="text-brand-text-primary font-mono text-sm">
              {dossier.user_id}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Type de produit
            </label>
            <p className="text-brand-text-primary">
              {dossier.product?.name || "Non défini"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Type de dossier
            </label>
            <p className="text-brand-text-primary">{dossier.type}</p>
          </div>
        </div>

        {/* Timestamps & Progress */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Créé
            </label>
            <p className="text-brand-text-primary">
              {formatDistanceToNow(new Date(dossier.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
            <p className="text-xs text-brand-text-secondary">
              {new Date(dossier.created_at).toLocaleString("fr-FR")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Dernière mise à jour
            </label>
            <p className="text-brand-text-primary">
              {formatDistanceToNow(new Date(dossier.updated_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
            <p className="text-xs text-brand-text-secondary">
              {new Date(dossier.updated_at).toLocaleString("fr-FR")}
            </p>
          </div>
          {dossier.completed_at && (
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                Terminé
              </label>
              <p className="text-brand-text-primary">
                {formatDistanceToNow(new Date(dossier.completed_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
              <p className="text-xs text-brand-text-secondary">
                {new Date(dossier.completed_at).toLocaleString("fr-FR")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-brand-text-secondary">
            Progression
          </label>
          <span className="text-sm text-brand-text-primary font-medium">
            {completedSteps} / {totalSteps} étapes ({progressPercentage}%)
          </span>
        </div>
        <div className="w-full h-2 bg-brand-dark-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      {dossier.current_step_instance && (
        <div className="mt-6 p-4 bg-brand-dark-bg border border-brand-stroke rounded-lg">
          <label className="block text-sm font-medium text-brand-text-secondary mb-2">
            Étape actuelle
          </label>
          <p className="text-brand-text-primary font-medium">
            {dossier.current_step_instance.step?.label || "Étape en cours"}
          </p>
          {dossier.current_step_instance.validation_status && (
            <p className="text-sm text-brand-text-secondary mt-1">
              Statut de validation :{" "}
              <span className="font-medium">
                {dossier.current_step_instance.validation_status}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Metadata (if exists and has cancellation info) */}
      {dossier.metadata &&
        (dossier.metadata.cancelled_at || dossier.metadata.cancellation_reason) && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <h3 className="text-sm font-medium text-red-400 mb-2">
              Information d'annulation
            </h3>
            {dossier.metadata.cancelled_at && (
              <p className="text-sm text-brand-text-secondary">
                <span className="font-medium">Date :</span>{" "}
                {new Date(dossier.metadata.cancelled_at).toLocaleString("fr-FR")}
              </p>
            )}
            {dossier.metadata.cancellation_reason && (
              <p className="text-sm text-brand-text-secondary mt-1">
                <span className="font-medium">Raison :</span>{" "}
                {dossier.metadata.cancellation_reason}
              </p>
            )}
          </div>
        )}
    </div>
  );
}
