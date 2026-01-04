"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useData } from "@/context/DataContext";
import { supabase } from "@/lib/supabaseClient";

interface ContactButtonProps {
  dossierId?: string | null;
  className?: string;
}

export function ContactButton({ dossierId, className }: ContactButtonProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const data = useData();
  
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleCloseModal = () => {
    setIsContactModalOpen(false);
    setContactSubject("");
    setContactMessage("");
    setContactError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setContactError(null);
    setIsSendingContact(true);

    try {
      // Récupérer tous les admins
      const { data: allProfiles, error: profilesError } = await data.getAllProfiles();
      
      if (profilesError) {
        throw new Error("Erreur lors de la récupération des administrateurs");
      }

      const admins = allProfiles?.filter((p: any) => p.role === 'admin') || [];

      if (admins.length === 0) {
        throw new Error("Aucun administrateur trouvé");
      }

      // Envoyer un message à chaque admin
      const messagePromises = admins.map((admin: any) =>
        supabase.from("messages").insert([
          {
            sender_id: user.id,
            sender_type: "user",
            recipient_id: admin.id,
            recipient_type: "admin",
            subject: contactSubject || "Message de contact",
            content: contactMessage,
            dossier_id: dossierId || null,
          },
        ])
      );

      const results = await Promise.all(messagePromises);
      const hasError = results.some((result) => result.error);

      if (hasError) {
        throw new Error("Erreur lors de l'envoi du message");
      }

      // Succès
      handleCloseModal();
      alert("Votre message a été envoyé avec succès aux administrateurs.");
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error);
      setContactError(error.message || "Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setIsSendingContact(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsContactModalOpen(true)}
        className={className || "w-full rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"}
      >
        Contacter
      </button>

      {/* Modal de contact - rendu via portail pour s'afficher au centre de l'écran */}
      {isContactModalOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Contacter les administrateurs</h3>
                <p className="text-sm text-neutral-400">Envoyez votre message à l'équipe de support.</p>
              </div>
              <button
                className="text-neutral-400 transition-colors hover:text-white"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {contactError && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {contactError}
                </div>
              )}

              <div>
                <label htmlFor="contact-subject" className="mb-2 block text-sm font-medium text-neutral-300">
                  Sujet
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Objet de votre message"
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-neutral-300">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Décrivez votre question ou problème..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
                  disabled={isSendingContact}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSendingContact || !contactSubject.trim() || !contactMessage.trim()}
                  className="flex-1 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                >
                  {isSendingContact ? "Envoi en cours..." : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

