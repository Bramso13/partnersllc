"use client";

import { useState } from "react";
import { DossierStatus } from "@/lib/dossiers";

interface CancelDossierButtonProps {
  dossierId: string;
  currentStatus: DossierStatus;
}

export function CancelDossierButton({
  dossierId,
  currentStatus,
}: CancelDossierButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyCancelled =
    currentStatus === "CLOSED" || currentStatus === "ERROR";

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      setError("Veuillez fournir une raison d'annulation");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cancellationReason: cancellationReason.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de l'annulation du dossier"
        );
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error("Error cancelling dossier:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isAlreadyCancelled}
        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAlreadyCancelled ? "Dossier annulé" : "Annuler le dossier"}
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface-light border border-brand-stroke rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-brand-text-primary mb-4">
              Annuler le dossier?
            </h3>
            <div className="mb-4">
              <p className="text-brand-text-secondary mb-2">
                Cette action va :
              </p>
              <ul className="list-disc list-inside text-brand-text-secondary space-y-1 mb-4">
                <li>Marquer le dossier comme ANNULÉ</li>
                <li>Envoyer une notification au client</li>
                <li>Empêcher tout traitement ultérieur</li>
                <li>Être enregistrée dans l'audit trail</li>
              </ul>
              <p className="text-red-400 font-medium">
                Cette action ne peut pas être annulée.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                Raison de l'annulation *
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Expliquez pourquoi ce dossier est annulé..."
                rows={4}
                className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-stroke rounded-lg text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCancellationReason("");
                  setError(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-brand-dark-bg border border-brand-stroke text-brand-text-primary rounded-lg hover:bg-brand-surface-light transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting || !cancellationReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "En cours..." : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
