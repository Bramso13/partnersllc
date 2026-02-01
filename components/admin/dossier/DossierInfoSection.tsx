"use client";

import { DossierWithDetails } from "@/lib/dossiers";
import { ProductStep } from "@/lib/workflow";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DossierInfoSectionProps {
  dossier: DossierWithDetails;
  productSteps: ProductStep[];
}

const surface = "bg-[#252628] border border-[#363636]";
const labelClass = "text-xs font-medium uppercase tracking-wider text-[#b7b7b7]";
const valueClass = "text-[#f9f9f9] font-mono text-sm";

export function DossierInfoSection({
  dossier,
  productSteps,
}: DossierInfoSectionProps) {
  const completedSteps = dossier.completed_steps_count || 0;
  const totalSteps = dossier.total_steps_count || 1;

  return (
    <article className={`rounded-xl ${surface} overflow-hidden`}>
      <div className="px-6 py-4 border-b border-[#363636]">
        <h2 className="text-lg font-semibold text-[#f9f9f9]">
          Informations du dossier
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Identifiants */}
        <section>
          <h3 className={labelClass}>Identifiants</h3>
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <dt className="text-[#b7b7b7] text-xs">ID dossier</dt>
              <dd className={valueClass}>{dossier.id}</dd>
            </div>
            <div>
              <dt className="text-[#b7b7b7] text-xs">ID utilisateur</dt>
              <dd className={valueClass}>{dossier.user_id}</dd>
            </div>
            <div>
              <dt className="text-[#b7b7b7] text-xs">Produit</dt>
              <dd className="text-[#f9f9f9] text-sm">{dossier.product?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#b7b7b7] text-xs">Type</dt>
              <dd className="text-[#f9f9f9] text-sm">{dossier.type}</dd>
            </div>
          </dl>
        </section>

        {/* Dates */}
        <section>
          <h3 className={labelClass}>Dates</h3>
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
            <div>
              <dt className="text-[#b7b7b7] text-xs">Créé</dt>
              <dd className="text-[#f9f9f9] text-sm">
                {formatDistanceToNow(new Date(dossier.created_at), { addSuffix: true, locale: fr })}
              </dd>
              <dd className="text-[#b7b7b7] text-xs mt-0.5">
                {new Date(dossier.created_at).toLocaleString("fr-FR")}
              </dd>
            </div>
            <div>
              <dt className="text-[#b7b7b7] text-xs">Dernière mise à jour</dt>
              <dd className="text-[#f9f9f9] text-sm">
                {formatDistanceToNow(new Date(dossier.updated_at), { addSuffix: true, locale: fr })}
              </dd>
              <dd className="text-[#b7b7b7] text-xs mt-0.5">
                {new Date(dossier.updated_at).toLocaleString("fr-FR")}
              </dd>
            </div>
            {dossier.completed_at && (
              <div>
                <dt className="text-[#b7b7b7] text-xs">Terminé</dt>
                <dd className="text-[#f9f9f9] text-sm">
                  {formatDistanceToNow(new Date(dossier.completed_at), { addSuffix: true, locale: fr })}
                </dd>
                <dd className="text-[#b7b7b7] text-xs mt-0.5">
                  {new Date(dossier.completed_at).toLocaleString("fr-FR")}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Étape actuelle */}
        {dossier.current_step_instance && (
          <section className={`rounded-lg bg-[#1e1f22] border border-[#363636] p-4`}>
            <h3 className={labelClass}>Étape actuelle</h3>
            <p className="text-[#f9f9f9] font-medium mt-1">
              {dossier.current_step_instance.step?.label ?? "Étape en cours"}
            </p>
            {dossier.current_step_instance.validation_status && (
              <p className="text-[#b7b7b7] text-sm mt-1">
                Validation :{" "}
                <span className="font-medium text-[#f9f9f9]">
                  {dossier.current_step_instance.validation_status}
                </span>
              </p>
            )}
          </section>
        )}

        {/* Annulation */}
        {dossier.metadata &&
          (dossier.metadata.cancelled_at || dossier.metadata.cancellation_reason) && (
            <section className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-red-400">
                Annulation
              </h3>
              {dossier.metadata.cancelled_at && (
                <p className="text-[#b7b7b7] text-sm mt-1">
                  {new Date(dossier.metadata.cancelled_at).toLocaleString("fr-FR")}
                </p>
              )}
              {dossier.metadata.cancellation_reason && (
                <p className="text-[#f9f9f9] text-sm mt-1">
                  {dossier.metadata.cancellation_reason}
                </p>
              )}
            </section>
          )}
      </div>
    </article>
  );
}
