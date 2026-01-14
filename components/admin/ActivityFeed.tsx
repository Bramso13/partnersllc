"use client";

import { ActivityEvent } from "@/lib/agent-metrics";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "à l'instant";
  } else if (diffMin < 60) {
    return `il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
  } else if (diffHour < 24) {
    return `il y a ${diffHour} heure${diffHour > 1 ? "s" : ""}`;
  } else if (diffDay < 7) {
    return `il y a ${diffDay} jour${diffDay > 1 ? "s" : ""}`;
  } else {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

function getEventIcon(eventType: string): string {
  switch (eventType) {
    case "DOCUMENT_UPLOADED":
      return "fa-file-upload";
    case "DOCUMENT_REVIEWED":
      return "fa-file-check";
    case "DOSSIER_CREATED":
      return "fa-folder-plus";
    case "STEP_COMPLETED":
      return "fa-step-forward";
    case "MESSAGE_SENT":
      return "fa-message";
    case "DOSSIER_STATUS_CHANGED":
      return "fa-arrows-rotate";
    case "ASSIGNMENT_CHANGED":
      return "fa-user-gear";
    default:
      return "fa-circle";
  }
}

function getEventColor(eventType: string): string {
  switch (eventType) {
    case "DOCUMENT_UPLOADED":
      return "text-blue-400";
    case "DOCUMENT_REVIEWED":
      return "text-green-400";
    case "DOSSIER_CREATED":
      return "text-purple-400";
    case "STEP_COMPLETED":
      return "text-yellow-400";
    case "MESSAGE_SENT":
      return "text-cyan-400";
    case "DOSSIER_STATUS_CHANGED":
      return "text-orange-400";
    case "ASSIGNMENT_CHANGED":
      return "text-pink-400";
    default:
      return "text-gray-400";
  }
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-brand-dark-bg border border-brand-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
          Activité récente
        </h2>
        <div className="text-center py-8 text-brand-text-secondary">
          <i className="fa-solid fa-inbox text-4xl mb-2 opacity-50"></i>
          <p>Aucune activité récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-dark-bg border border-brand-border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
        Activité récente
      </h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 pb-4 border-b border-brand-border last:border-0 last:pb-0"
          >
            <div
              className={`${getEventColor(
                activity.event_type
              )} text-xl flex-shrink-0 mt-1`}
            >
              <i className={`fa-solid ${getEventIcon(activity.event_type)}`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-brand-text-primary">{activity.description}</p>
              <p className="text-sm text-brand-text-secondary mt-1">
                {formatRelativeTime(activity.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}