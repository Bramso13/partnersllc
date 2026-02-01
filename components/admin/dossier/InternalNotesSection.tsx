"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface InternalNote {
  id: string;
  note_text: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

interface InternalNotesSectionProps {
  dossierId: string;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] placeholder-[#b7b7b7]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#50b989] focus:border-transparent resize-none";

export function InternalNotesSection({ dossierId }: InternalNotesSectionProps) {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/notes`);
      if (!response.ok) throw new Error("Erreur chargement notes");
      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Erreur lors du chargement des notes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [dossierId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteText: newNote.trim() }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur ajout note");
      }
      const added = await response.json();
      setNotes((prev) => [added, ...prev]);
      setNewNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Ajouter une note interne…"
        rows={2}
        className={inputClass}
      />
      <button
        type="button"
        onClick={handleAddNote}
        disabled={isSubmitting || !newNote.trim()}
        className="w-full px-3 py-2 rounded-lg bg-[#50b989] text-[#191a1d] text-sm font-medium hover:bg-[#50b989]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Ajout…" : "Ajouter"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {isLoading ? (
          <p className="text-xs text-[#b7b7b7]">Chargement…</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-[#b7b7b7]">Aucune note</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-2.5 rounded-lg bg-[#1e1f22] border border-[#363636]"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-[#f9f9f9] truncate">
                  {note.user_name ?? "Utilisateur"}
                </span>
                <span className="text-[10px] text-[#b7b7b7] shrink-0">
                  {formatDistanceToNow(new Date(note.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
              <p className="text-xs text-[#b7b7b7] whitespace-pre-wrap break-words">
                {note.note_text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
