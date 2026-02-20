"use client";

import { useEffect } from "react";
import { useHubEvents } from "@/lib/contexts/hub/events/HubEventsContext";
import {
  CalendarDays,
  MapPin,
  Video,
  Users,
  Loader2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import type { HubEvent } from "@/types/hub-events";

const TYPE_ICONS = {
  online: Video,
  irl: MapPin,
  hybrid: MapPin,
};

const TAG_COLORS: Record<string, string> = {
  Mastermind: "#A78BFA",
  Formation: "#00F0FF",
  Networking: "#50B989",
  Juridique: "#F59E0B",
  Tech: "#00F0FF",
  Finance: "#F59E0B",
};

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RegisterButton({ event }: { event: HubEvent }) {
  const { register, unregister, isRegistering } = useHubEvents();
  const isFull =
    event.max_attendees !== null &&
    event.attendee_count >= event.max_attendees &&
    !event.is_registered;

  const handleClick = async () => {
    try {
      if (event.is_registered) {
        await unregister(event.id);
        toast.success("Inscription annulée");
      } else {
        const res = await register(event.id);
        if (res.waitlisted) {
          toast.success("Vous êtes sur la liste d'attente");
        } else {
          toast.success("Inscription confirmée !");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  if (event.is_registered) {
    return (
      <button
        onClick={handleClick}
        disabled={isRegistering}
        className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all disabled:opacity-40"
      >
        {isRegistering ? "…" : "Annuler"}
      </button>
    );
  }

  if (isFull) {
    return (
      <button
        onClick={handleClick}
        disabled={isRegistering}
        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
        style={{
          background: "rgba(245,158,11,0.12)",
          color: "#F59E0B",
          border: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        {isRegistering ? "…" : "Liste d'attente"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isRegistering}
      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40"
      style={{
        background: "linear-gradient(135deg, #A78BFA, #8B5CF6)",
        color: "#fff",
      }}
    >
      {isRegistering ? "…" : "S'inscrire"}
    </button>
  );
}

function EventCard({ event }: { event: HubEvent }) {
  const TypeIcon = TYPE_ICONS[event.type] ?? Video;
  const tagColor = event.tags[0]
    ? (TAG_COLORS[event.tags[0]] ?? "#94A3B8")
    : "#94A3B8";
  const fillPct = event.max_attendees
    ? (event.attendee_count / event.max_attendees) * 100
    : 0;

  return (
    <div
      className="rounded-2xl p-5 transition-all hover:border-white/10"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{
            background: `${tagColor}12`,
            border: `1px solid ${tagColor}20`,
          }}
        >
          <TypeIcon size={18} style={{ color: tagColor }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Tag + badge inscrit */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {event.tags[0] && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                style={{ background: `${tagColor}15`, color: tagColor }}
              >
                {event.tags[0]}
              </span>
            )}
            {event.is_registered && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(80,185,137,0.15)",
                  color: "#50B989",
                }}
              >
                ✓ Inscrit
                {event.registration_status === "waitlisted" ? " (attente)" : ""}
              </span>
            )}
          </div>

          <h3 className="text-white font-semibold text-sm leading-snug">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-white/35 text-xs leading-relaxed mt-1.5 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="flex items-center gap-1.5 text-white/35 text-xs">
              <CalendarDays size={11} />
              {formatDate(event.start_at)} · {formatTime(event.start_at)}–
              {formatTime(event.end_at ?? "")}
            </span>
            <span className="flex items-center gap-1.5 text-white/35 text-xs">
              <Users size={11} />
              {event.attendee_count}
              {event.max_attendees ? `/${event.max_attendees}` : ""}
            </span>
            {event.organizer_display_name && (
              <span className="text-white/25 text-xs">
                Par {event.organizer_display_name}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <RegisterButton event={event} />
        </div>
      </div>

      {/* Barre de remplissage */}
      {event.max_attendees && (
        <div className="mt-4 h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, fillPct)}%`,
              background: tagColor,
              opacity: 0.45,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function EventsList() {
  const { events, isLoading, error, fetchEvents } = useHubEvents();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-white/20" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-sm text-red-400/60 py-8">{error}</p>;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/20">
        <Calendar size={36} />
        <p className="text-sm">Aucun événement à venir</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
