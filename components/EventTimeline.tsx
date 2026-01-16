"use client";

import { BaseEvent, EventType, ActorType } from "@/lib/events";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface EventTimelineProps {
  events: BaseEvent[];
  className?: string;
  showActor?: boolean;
  maxHeight?: string;
}

interface EventDisplay {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  actor?: string;
  timestamp: string;
}

/**
 * EventTimeline component displays events in chronological order (newest first)
 * with human-readable descriptions and visual indicators
 */
export function EventTimeline({
  events,
  className = "",
  showActor = true,
  maxHeight = "max-h-96",
}: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={`text-center py-8 text-brand-text-secondary ${className}`}>
        <p>Aucun événement à afficher</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={`overflow-y-auto ${maxHeight}`}>
        {events.map((event, index) => (
          <EventItem
            key={event.id}
            event={event}
            showActor={showActor}
            isLast={index === events.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function EventItem({
  event,
  showActor,
  isLast,
}: {
  event: BaseEvent;
  showActor: boolean;
  isLast: boolean;
}) {
  const display = getEventDisplay(event);

  return (
    <div className="relative flex items-start space-x-4">
      {/* Timeline line and icon */}
      <div className="flex-shrink-0 w-10 flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full ${display.iconBg} flex items-center justify-center`}
        >
          <i className={`${display.icon} ${display.iconColor} text-sm`}></i>
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-brand-dark-border mt-2 min-h-[4rem]"></div>
        )}
      </div>

      {/* Event content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium text-brand-text-primary">{display.title}</p>
            <p className="text-sm text-brand-text-secondary mt-1">
              {display.description}
            </p>
            {showActor && display.actor && (
              <p className="text-xs text-brand-text-secondary mt-1">
                {display.actor}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">{display.timestamp}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Convert event to human-readable display format
 */
function getEventDisplay(event: BaseEvent): EventDisplay {
  const timestamp = formatDistanceToNow(new Date(event.created_at), {
    addSuffix: true,
    locale: fr,
  });

  const actor = getActorDisplay(event.actor_type, event.actor_id, event.payload);

  switch (event.event_type) {
    case "DOSSIER_CREATED":
      return {
        icon: "fas fa-folder-plus",
        iconBg: "bg-brand-primary/20",
        iconColor: "text-brand-primary",
        title: "Dossier créé",
        description: "Un nouveau dossier a été créé pour votre compte.",
        actor,
        timestamp,
      };

    case "DOSSIER_STATUS_CHANGED": {
      const payload = event.payload as {
        old_status?: string;
        new_status?: string;
        dossier_type?: string;
      };
      const oldStatus = payload.old_status || "inconnu";
      const newStatus = payload.new_status || "inconnu";
      return {
        icon: "fas fa-sync-alt",
        iconBg: "bg-brand-warning/20",
        iconColor: "text-brand-warning",
        title: "Statut du dossier modifié",
        description: `Le statut est passé de "${formatStatus(oldStatus)}" à "${formatStatus(newStatus)}".`,
        actor,
        timestamp,
      };
    }

    case "STEP_STARTED": {
      const payload = event.payload as { step_id?: string; dossier_id?: string };
      return {
        icon: "fas fa-play",
        iconBg: "bg-brand-info/20",
        iconColor: "text-brand-info",
        title: "Étape démarrée",
        description: "Une nouvelle étape du processus a été démarrée.",
        actor,
        timestamp,
      };
    }

    case "STEP_COMPLETED": {
      const payload = event.payload as { step_id?: string; dossier_id?: string };
      return {
        icon: "fas fa-check-circle",
        iconBg: "bg-brand-success/20",
        iconColor: "text-brand-success",
        title: "Étape complétée",
        description: "Une étape du processus a été complétée avec succès.",
        actor,
        timestamp,
      };
    }

    case "DOCUMENT_UPLOADED": {
      const payload = event.payload as {
        file_name?: string;
        document_type?: string;
        uploaded_by_type?: ActorType;
      };
      const fileName = payload.file_name || "document";
      return {
        icon: "fas fa-upload",
        iconBg: "bg-brand-info/20",
        iconColor: "text-brand-info",
        title: "Document uploadé",
        description: `Le document "${fileName}" a été uploadé avec succès.`,
        actor,
        timestamp,
      };
    }

    case "DOCUMENT_REVIEWED": {
      const payload = event.payload as {
        review_status?: "APPROVED" | "REJECTED";
        document_type?: string;
        rejection_reason?: string;
        reviewer_name?: string;
      };
      const isApproved = payload.review_status === "APPROVED";
      const docType = payload.document_type || "document";
      return {
        icon: isApproved ? "fas fa-check" : "fas fa-times",
        iconBg: isApproved ? "bg-brand-success/20" : "bg-red-500/20",
        iconColor: isApproved ? "text-brand-success" : "text-red-500",
        title: isApproved ? "Document approuvé" : "Document rejeté",
        description: isApproved
          ? `Le document "${docType}" a été approuvé.`
          : `Le document "${docType}" a été rejeté.${payload.rejection_reason ? ` Raison: ${payload.rejection_reason}` : ""}`,
        actor: payload.reviewer_name || actor,
        timestamp,
      };
    }

    case "DOCUMENT_DELIVERED": {
      const payload = event.payload as {
        document_count?: number;
        step_name?: string | null;
        message?: string | null;
      };
      const docCount = payload.document_count || 1;
      const stepName = payload.step_name;
      const title = stepName
        ? `Étape "${stepName}" terminée`
        : "Documents reçus";
      const description = stepName
        ? `Votre conseiller a terminé l'étape "${stepName}" et vous a envoyé ${docCount} document(s).`
        : `Votre conseiller vous a envoyé ${docCount} document(s).${payload.message ? ` ${payload.message}` : ""}`;
      return {
        icon: "fas fa-file-download",
        iconBg: "bg-brand-primary/20",
        iconColor: "text-brand-primary",
        title,
        description,
        actor,
        timestamp,
      };
    }

    case "PAYMENT_RECEIVED": {
      const payload = event.payload as { amount_paid?: number; currency?: string };
      const amount = payload.amount_paid
        ? (payload.amount_paid / 100).toFixed(2)
        : "0.00";
      const currency = payload.currency?.toUpperCase() || "USD";
      return {
        icon: "fas fa-credit-card",
        iconBg: "bg-brand-success/20",
        iconColor: "text-brand-success",
        title: "Paiement reçu",
        description: `Paiement de ${amount} ${currency} reçu avec succès.`,
        actor,
        timestamp,
      };
    }

    case "PAYMENT_FAILED": {
      const payload = event.payload as { reason?: string };
      return {
        icon: "fas fa-exclamation-triangle",
        iconBg: "bg-red-500/20",
        iconColor: "text-red-500",
        title: "Échec du paiement",
        description: `Le paiement a échoué.${payload.reason ? ` Raison: ${payload.reason}` : ""}`,
        actor,
        timestamp,
      };
    }

    case "MESSAGE_SENT": {
      const payload = event.payload as { content?: string; sender_type?: ActorType };
      const preview = payload.content
        ? payload.content.substring(0, 50) + (payload.content.length > 50 ? "..." : "")
        : "Message envoyé";
      return {
        icon: "fas fa-comment",
        iconBg: "bg-brand-info/20",
        iconColor: "text-brand-info",
        title: "Message envoyé",
        description: preview,
        actor,
        timestamp,
      };
    }

    case "ERROR": {
      const payload = event.payload as { error_message?: string; error_type?: string };
      return {
        icon: "fas fa-exclamation-circle",
        iconBg: "bg-red-500/20",
        iconColor: "text-red-500",
        title: "Erreur système",
        description: payload.error_message || "Une erreur s'est produite.",
        actor,
        timestamp,
      };
    }

    default:
      return {
        icon: "fas fa-circle",
        iconBg: "bg-brand-dark-surface",
        iconColor: "text-brand-text-secondary",
        title: event.event_type,
        description: "Événement système",
        actor,
        timestamp,
      };
  }
}

/**
 * Format status code to human-readable French
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    QUALIFICATION: "Qualification",
    FORM_SUBMITTED: "Formulaire soumis",
    NM_PENDING: "En attente de nom",
    LLC_ACCEPTED: "LLC acceptée",
    EIN_PENDING: "En attente d'EIN",
    BANK_PREPARATION: "Préparation bancaire",
    BANK_OPENED: "Banque ouverte",
    WAITING_48H: "Attente 48h",
    IN_PROGRESS: "En cours",
    UNDER_REVIEW: "En révision",
    COMPLETED: "Complété",
    CLOSED: "Fermé",
    ERROR: "Erreur",
  };

  return statusMap[status] || status;
}

/**
 * Get actor display string
 */
function getActorDisplay(
  actorType: ActorType | null,
  actorId: string | null,
  payload: Record<string, any>
): string | undefined {
  if (!actorType) return undefined;

  switch (actorType) {
    case "USER":
      return "Par l'utilisateur";
    case "AGENT":
      // Try to get agent name from payload
      if (payload.reviewer_name) {
        return `Par ${payload.reviewer_name}`;
      }
      return "Par un agent";
    case "SYSTEM":
      return "Par le système";
    default:
      return undefined;
  }
}
