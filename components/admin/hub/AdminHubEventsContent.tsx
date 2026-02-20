"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Users,
  MapPin,
  Video,
  Globe,
  Clock,
  Tag,
  ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = "online" | "irl" | "hybrid";
type EventStatus = "draft" | "published" | "cancelled";

interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  start_at: string;
  end_at: string | null;
  timezone: string;
  location_text: string | null;
  meet_url: string | null;
  max_attendees: number | null;
  attendee_count: number;
  status: EventStatus;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
}

interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  start_at: string;
  end_at: string;
  timezone: string;
  location_text: string;
  meet_url: string;
  max_attendees: string;
  status: EventStatus;
  tags: string;
}

const EMPTY_FORM: EventFormData = {
  title: "",
  description: "",
  type: "online",
  start_at: "",
  end_at: "",
  timezone: "Europe/Paris",
  location_text: "",
  meet_url: "",
  max_attendees: "",
  status: "draft",
  tags: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toLocalDatetimeInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_COLORS: Record<EventStatus, string> = {
  draft:     "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border border-red-500/30",
};

const STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  cancelled: "Annulé",
};

const TYPE_ICONS: Record<EventType, React.ReactNode> = {
  online: <Video size={14} className="text-cyan-400" />,
  irl:    <MapPin size={14} className="text-violet-400" />,
  hybrid: <Globe size={14} className="text-amber-400" />,
};

const TYPE_LABELS: Record<EventType, string> = {
  online: "En ligne",
  irl: "Présentiel",
  hybrid: "Hybride",
};

// ── Modal ─────────────────────────────────────────────────────────────────────

function EventModal({
  event,
  onClose,
  onSaved,
}: {
  event: AdminEvent | null;
  onClose: () => void;
  onSaved: (e: AdminEvent) => void;
}) {
  const isEdit = !!event;
  const [form, setForm] = useState<EventFormData>(() => {
    if (!event) return EMPTY_FORM;
    return {
      title: event.title,
      description: event.description ?? "",
      type: event.type,
      start_at: toLocalDatetimeInput(event.start_at),
      end_at: event.end_at ? toLocalDatetimeInput(event.end_at) : "",
      timezone: event.timezone,
      location_text: event.location_text ?? "",
      meet_url: event.meet_url ?? "",
      max_attendees: event.max_attendees != null ? String(event.max_attendees) : "",
      status: event.status,
      tags: event.tags.join(", "),
    };
  });
  const [saving, setSaving] = useState(false);

  function set(key: keyof EventFormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      start_at: form.start_at ? new Date(form.start_at).toISOString() : undefined,
      end_at: form.end_at ? new Date(form.end_at).toISOString() : undefined,
      timezone: form.timezone,
      location_text: form.location_text || undefined,
      meet_url: form.meet_url || undefined,
      max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
      status: form.status,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    try {
      const url = isEdit
        ? `/api/admin/hub/events/${event!.id}`
        : "/api/admin/hub/events";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Erreur lors de la sauvegarde");
        return;
      }

      const data = await res.json();
      toast.success(isEdit ? "Événement mis à jour" : "Événement créé");
      onSaved({ ...data.event, attendee_count: event?.attendee_count ?? 0 });
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111318] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Calendar size={16} className="text-indigo-400" />
            </div>
            <h2 className="font-semibold text-white">
              {isEdit ? "Modifier l'événement" : "Créer un événement"}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors text-xl leading-none">×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Titre */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">Titre *</label>
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Titre de l'événement"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Description de l'événement..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>

          {/* Type + Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">Type *</label>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors pr-8"
                >
                  <option value="online">En ligne</option>
                  <option value="irl">Présentiel</option>
                  <option value="hybrid">Hybride</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">Statut *</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors pr-8"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="cancelled">Annulé</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">Début *</label>
              <input
                required
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => set("start_at", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">Fin</label>
              <input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => set("end_at", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Lieu / URL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">
                <MapPin size={11} className="inline mr-1" />Lieu (présentiel)
              </label>
              <input
                value={form.location_text}
                onChange={(e) => set("location_text", e.target.value)}
                placeholder="Ex: Paris, 75001"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">
                <Video size={11} className="inline mr-1" />URL de visio
              </label>
              <input
                type="url"
                value={form.meet_url}
                onChange={(e) => set("meet_url", e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Capacité + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">
                <Users size={11} className="inline mr-1" />Capacité max
              </label>
              <input
                type="number"
                min="1"
                value={form.max_attendees}
                onChange={(e) => set("max_attendees", e.target.value)}
                placeholder="Illimité"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">
                <Tag size={11} className="inline mr-1" />Tags (séparés par virgule)
              </label>
              <input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="networking, business..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block font-medium uppercase tracking-wider">
              <Clock size={11} className="inline mr-1" />Fuseau horaire
            </label>
            <div className="relative">
              <select
                value={form.timezone}
                onChange={(e) => set("timezone", e.target.value)}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors pr-8"
              >
                <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                <option value="America/Chicago">America/Chicago (UTC-6/-5)</option>
                <option value="America/Denver">America/Denver (UTC-7/-6)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (UTC-8/-7)</option>
                <option value="UTC">UTC</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white/80 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
            >
              {saving ? "Sauvegarde..." : isEdit ? "Mettre à jour" : "Créer l'événement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  event,
  onClose,
  onDeleted,
}: {
  event: AdminEvent;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/hub/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Erreur lors de la suppression");
        return;
      }
      toast.success("Événement supprimé");
      onDeleted(event.id);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111318] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <Trash2 size={16} className="text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Supprimer l&apos;événement</p>
            <p className="text-white/40 text-xs mt-0.5">Cette action est irréversible</p>
          </div>
        </div>
        <p className="text-sm text-white/70 mb-5">
          Voulez-vous supprimer <span className="font-medium text-white">&ldquo;{event.title}&rdquo;</span> ?
          Toutes les inscriptions seront perdues.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/60 hover:text-white/80 hover:bg-white/5 border border-white/10 transition-colors">
            Annuler
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-colors">
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quick status toggle ───────────────────────────────────────────────────────

function QuickStatusBadge({
  event,
  onUpdate,
}: {
  event: AdminEvent;
  onUpdate: (updated: AdminEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function changeStatus(newStatus: EventStatus) {
    if (newStatus === event.status) { setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/hub/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate({ ...data.event, attendee_count: event.attendee_count });
        toast.success("Statut mis à jour");
      }
    } catch { /* ignore */ }
    finally { setLoading(false); setOpen(false); }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${STATUS_COLORS[event.status]}`}
      >
        {STATUS_LABELS[event.status]}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-20 bg-[#1a1d24] border border-white/10 rounded-xl shadow-xl py-1 min-w-[130px]">
          {(["draft", "published", "cancelled"] as EventStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/5 ${s === event.status ? "text-white/40" : "text-white/80"}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminHubEventsContent() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<EventStatus | "all">("all");
  const [editEvent, setEditEvent] = useState<AdminEvent | null | "new">(null);
  const [deleteEvent, setDeleteEvent] = useState<AdminEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/hub/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    } catch {
      toast.error("Impossible de charger les événements");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = filterStatus === "all"
    ? events
    : events.filter((e) => e.status === filterStatus);

  function handleSaved(updated: AdminEvent) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
    setEditEvent(null);
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDeleteEvent(null);
  }

  function handleStatusUpdate(updated: AdminEvent) {
    setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e));
  }

  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === "published").length,
    draft: events.filter((e) => e.status === "draft").length,
    totalAttendees: events.reduce((s, e) => s + e.attendee_count, 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Événements Hub</h1>
          <p className="text-white/40 text-sm mt-1">Gérez les événements de la communauté PartnersHub</p>
        </div>
        <button
          onClick={() => setEditEvent("new")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} />
          Créer un événement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Publiés", value: stats.published, color: "text-emerald-400" },
          { label: "Brouillons", value: stats.draft, color: "text-yellow-400" },
          { label: "Inscrits cumulés", value: stats.totalAttendees, color: "text-indigo-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/40 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(["all", "published", "draft", "cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterStatus === s
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 border border-white/10"
            }`}
          >
            {s === "all" ? "Tous" : STATUS_LABELS[s]}
          </button>
        ))}
        <span className="ml-auto text-xs text-white/30">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Calendar size={24} className="text-white/20" />
          </div>
          <p className="text-white/40 text-sm">Aucun événement</p>
          <p className="text-white/20 text-xs mt-1">Cliquez sur &ldquo;Créer un événement&rdquo; pour commencer</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["Événement", "Type", "Date", "Inscrits", "Statut", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((event, i) => (
                <tr
                  key={event.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                >
                  {/* Titre */}
                  <td className="px-5 py-4 max-w-[260px]">
                    <p className="text-sm font-medium text-white truncate">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-white/30 truncate mt-0.5">{event.description}</p>
                    )}
                    {event.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {event.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/40 border border-white/10">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-white/60">
                      {TYPE_ICONS[event.type]}
                      {TYPE_LABELS[event.type]}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4">
                    <p className="text-xs text-white/70">{formatDate(event.start_at)}</p>
                    {event.end_at && (
                      <p className="text-[10px] text-white/30 mt-0.5">→ {formatDate(event.end_at)}</p>
                    )}
                    {event.location_text && (
                      <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                        <MapPin size={9} />{event.location_text}
                      </p>
                    )}
                  </td>

                  {/* Inscrits */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                      <Users size={13} className="text-white/30" />
                      {event.attendee_count}
                      {event.max_attendees && (
                        <span className="text-white/30 text-xs">/ {event.max_attendees}</span>
                      )}
                    </div>
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-4">
                    <QuickStatusBadge event={event} onUpdate={handleStatusUpdate} />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditEvent(event)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/10 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteEvent(event)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {editEvent !== null && (
        <EventModal
          event={editEvent === "new" ? null : editEvent}
          onClose={() => setEditEvent(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteEvent && (
        <DeleteConfirm
          event={deleteEvent}
          onClose={() => setDeleteEvent(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
