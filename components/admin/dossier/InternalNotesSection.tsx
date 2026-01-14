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

export function InternalNotesSection({
  dossierId,
}: InternalNotesSectionProps) {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [dossierId]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/notes`);
      if (!response.ok) throw new Error("Erreur lors du chargement des notes");

      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Erreur lors du chargement des notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteText: newNote.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout de la note");
      }

      const addedNote = await response.json();
      setNotes([addedNote, ...notes]);
      setNewNote("");
    } catch (err) {
      console.error("Error adding note:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Ajouter une note interne..."
          rows={3}
          className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-stroke rounded-lg text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
        />
        <button
          onClick={handleAddNote}
          disabled={isSubmitting || !newNote.trim()}
          className="mt-2 w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Ajout en cours..." : "Ajouter une note"}
        </button>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Notes Timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-brand-text-secondary">
            Chargement des notes...
          </p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">
            Aucune note pour le moment
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-brand-dark-bg border border-brand-stroke rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-brand-text-primary">
                  {note.user_name || "Utilisateur"}
                </span>
                <span className="text-xs text-brand-text-secondary">
                  {formatDistanceToNow(new Date(note.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
              <p className="text-sm text-brand-text-secondary whitespace-pre-wrap">
                {note.note_text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
