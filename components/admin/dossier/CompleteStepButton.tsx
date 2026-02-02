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
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de la complétion");
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        Compléter l’étape
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-xl bg-[#252628] border border-[#363636] p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-[#f9f9f9] mb-2">
              Compléter l’étape manuellement ?
            </h3>
            <p className="text-sm text-[#b7b7b7] mb-4">
              Marquer « {stepName} » comme complétée. Cette action contourne la
              validation automatique et sera enregistrée.
            </p>
            {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#363636] text-[#f9f9f9] text-sm hover:bg-[#363636]/50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "En cours…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
