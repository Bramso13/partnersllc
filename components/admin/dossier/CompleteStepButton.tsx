"use client";

import { useState } from "react";

interface CompleteStepButtonProps {
  dossierId: string;
  stepInstanceId: string;
  stepName: string;
}

export function CompleteStepButton({
  dossierId,
  stepInstanceId,
  stepName,
}: CompleteStepButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/complete-step`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepInstanceId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la complétion de l'étape"
        );
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error("Error completing step:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Compléter l'étape
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface-light border border-brand-stroke rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-brand-text-primary mb-4">
              Compléter l'étape manuellement?
            </h3>
            <p className="text-brand-text-secondary mb-4">
              Vous êtes sur le point de marquer l'étape "{stepName}" comme
              complétée manuellement. Cette action :
            </p>
            <ul className="list-disc list-inside text-brand-text-secondary mb-6 space-y-1">
              <li>Contourne la validation automatique des documents</li>
              <li>Marque l'étape comme complétée immédiatement</li>
              <li>Permet de progresser même si les documents ne sont pas tous approuvés</li>
              <li>Sera enregistrée dans l'audit trail</li>
            </ul>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-brand-dark-bg border border-brand-stroke text-brand-text-primary rounded-lg hover:bg-brand-surface-light transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "En cours..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
