"use client";

import { useState } from "react";
import { DossierStatus } from "@/lib/dossiers";

interface CancelDossierButtonProps {
  dossierId: string;
  currentStatus: DossierStatus;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] placeholder-[#b7b7b7]/60 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none";

export function CancelDossierButton({
  dossierId,
  currentStatus,
}: CancelDossierButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyCancelled =
    currentStatus === "CLOSED" || currentStatus === "ERROR";

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError("Veuillez indiquer une raison");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellationReason: reason.trim() }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de l'annulation");
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
        disabled={isAlreadyCancelled}
        className="w-full px-4 py-2.5 rounded-lg bg-red-600/90 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAlreadyCancelled ? "Dossier annulé" : "Annuler le dossier"}
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-xl bg-[#252628] border border-[#363636] p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-[#f9f9f9] mb-2">
              Annuler le dossier ?
            </h3>
            <p className="text-sm text-[#b7b7b7] mb-4">
              Le dossier sera marqué annulé, le client sera notifié. Action irréversible.
            </p>
            <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
              Raison <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Pourquoi ce dossier est-il annulé ?"
              rows={3}
              className={inputClass}
            />
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setReason("");
                  setError(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#363636] text-[#f9f9f9] text-sm hover:bg-[#363636]/50 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting || !reason.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "En cours…" : "Confirmer l’annulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
