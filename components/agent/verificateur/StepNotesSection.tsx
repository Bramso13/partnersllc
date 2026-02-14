"use client";

import { useState } from "react";
import { MessageSquare, Plus, X, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api/useApi";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { VerificateurStepDetails } from "@/lib/agent-steps";

interface StepNotesSectionProps {
  dossierId: string;
  initialNotes: VerificateurStepDetails["notes"];
  agentId: string;
}

export function StepNotesSection({
  dossierId,
  initialNotes,
  agentId: _agentId,
}: StepNotesSectionProps) {
  const api = useApi();
  const [notes, setNotes] = useState(initialNotes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitNote = async () => {
    if (!newNoteContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = await api.post<{ note: (typeof initialNotes)[number] }>(
        `/api/agent/dossiers/${dossierId}/notes`,
        { content: newNoteContent.trim() }
      );
      if (data?.note) {
        setNotes((prev) => [data.note, ...prev]);
      }
      setNewNoteContent("");
      setIsModalOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'ajout de la note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-[#363636] rounded-2xl bg-[#191A1D] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#363636] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-text-primary">
          Notes internes
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A2B2F] hover:bg-[#363636] text-brand-text-secondary hover:text-brand-text-primary transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="p-5">
        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-[#2A2B2F] border border-[#363636]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-brand-primary">
                      {note.agent_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-brand-text-primary">
                      {note.agent_name}
                    </span>
                    <span className="text-xs text-brand-text-secondary ml-2">
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-brand-text-primary text-sm whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 text-brand-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-brand-text-secondary">
              Aucune note interne pour ce dossier.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-sm text-brand-primary hover:underline"
            >
              Ajouter la premiere note
            </button>
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#191A1D] rounded-2xl border border-[#363636] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#363636]">
              <h3 className="text-lg font-semibold text-brand-text-primary">
                Ajouter une note
              </h3>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                disabled={isSubmitting}
                className="p-2 rounded-lg hover:bg-[#2A2B2F] text-brand-text-secondary hover:text-brand-text-primary transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="note-content"
                  className="block text-sm font-medium text-brand-text-primary mb-2"
                >
                  Contenu de la note
                </label>
                <textarea
                  id="note-content"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Saisissez votre note interne..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#2A2B2F] border border-[#363636] rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary resize-none"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <p className="text-sm text-brand-text-secondary">
                Cette note sera visible par tous les agents mais jamais par les
                clients.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#2A2B2F] hover:bg-[#363636] text-brand-text-secondary hover:text-brand-text-primary transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitNote}
                  disabled={!newNoteContent.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ajouter la note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
