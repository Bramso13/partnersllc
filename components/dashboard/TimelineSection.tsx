"use client";

import { DossierWithDetails } from "@/lib/dossiers";

interface TimelineSectionProps {
  dossier: DossierWithDetails;
}

export function TimelineSection({ dossier }: TimelineSectionProps) {
  // Get timeline events from step instances
  const events = getTimelineEvents(dossier);

  return (
    <div id="timeline-section" className="col-span-2">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
        Timeline détaillée
      </h3>
      <div className="bg-brand-dark-bg rounded-2xl p-6 card-hover space-y-4">
        {events.map((event, index) => (
          <div
            key={event.id || index}
            className="relative flex items-start space-x-4"
          >
            <div className="flex-shrink-0 w-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full ${event.iconBg} flex items-center justify-center`}
              >
                <i className={`${event.icon} ${event.iconColor}`}></i>
              </div>
              {index < events.length - 1 && (
                <div className="w-0.5 h-16 bg-brand-dark-border mt-2"></div>
              )}
            </div>
            <div>
              <p className="font-medium text-brand-text-primary">{event.title}</p>
              <p className="text-sm text-brand-text-secondary mt-1">
                {event.description}
              </p>
              {event.date && (
                <p className="text-xs text-gray-500 mt-1">{event.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimelineEvent {
  id?: string;
  title: string;
  description: string;
  date?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

function getTimelineEvents(dossier: DossierWithDetails): TimelineEvent[] {
  // Retourner uniquement les événements réels basés sur les step_instances
  if (!dossier.step_instances || dossier.step_instances.length === 0) {
    return [];
  }

  return dossier.step_instances
    .sort((a, b) => {
      const aDate = a.completed_at || a.started_at || "";
      const bDate = b.completed_at || b.started_at || "";
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    })
    .map((si) => {
      const validationStatus = si.validation_status;
      const isCompleted = si.completed_at !== null;
      const isCurrentStep = si.id === dossier.current_step_instance_id;

      // Déterminer l'état réel basé sur validation_status et completed_at
      if (validationStatus === "APPROVED" || isCompleted) {
        return {
          id: si.id,
          title: si.step?.label || "Étape complétée",
          description: validationStatus === "REJECTED" 
            ? si.rejection_reason || "Étape rejetée"
            : "Étape terminée avec succès.",
          date: si.completed_at
            ? new Date(si.completed_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : undefined,
          icon: validationStatus === "REJECTED" ? "fas fa-times" : "fas fa-check",
          iconBg: validationStatus === "REJECTED" 
            ? "bg-red-500/20" 
            : "bg-brand-success/20",
          iconColor: validationStatus === "REJECTED" 
            ? "text-red-500" 
            : "text-brand-success",
        };
      } else if (
        validationStatus === "SUBMITTED" ||
        validationStatus === "UNDER_REVIEW" ||
        (isCurrentStep && si.started_at !== null)
      ) {
        return {
          id: si.id,
          title: si.step?.label || "Étape en cours",
          description:
            validationStatus === "UNDER_REVIEW"
              ? "En cours de validation par notre équipe."
              : validationStatus === "SUBMITTED"
                ? "Soumis, en attente de validation."
                : "Traitement en cours...",
          date: si.started_at
            ? new Date(si.started_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : undefined,
          icon: "fas fa-spinner fa-spin",
          iconBg: "bg-brand-warning/20",
          iconColor: "text-brand-warning",
        };
      } else if (validationStatus === "DRAFT" || si.started_at !== null) {
        return {
          id: si.id,
          title: si.step?.label || "Étape en brouillon",
          description: "Étape en cours de préparation.",
          icon: "fas fa-edit",
          iconBg: "bg-brand-dark-surface",
          iconColor: "text-brand-text-secondary",
        };
      } else {
        return {
          id: si.id,
          title: si.step?.label || "Étape à venir",
          description: "Cette étape sera traitée prochainement.",
          icon: "fas fa-clock",
          iconBg: "bg-brand-dark-surface",
          iconColor: "text-brand-text-secondary",
        };
      }
    });
}
