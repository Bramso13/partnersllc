"use client";

import { useState } from "react";
import type { HubSubscriptionRow } from "@/lib/admin/hub-subscriptions";

interface CancelSubscriptionModalProps {
  row: HubSubscriptionRow;
  onClose: () => void;
  onSuccess: (subscriptionId: string) => void;
}

export function CancelSubscriptionModal({
  row,
  onClose,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/hub/subscriptions/${row.id}/cancel`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erreur lors de l'annulation");
        return;
      }
      onSuccess(row.id);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Erreur réseau");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-subscription-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#2D3033] border border-[#363636] rounded-xl shadow-xl p-6"
      >
        <h2 id="cancel-subscription-title" className="text-lg font-semibold text-[#F9F9F9] mb-2">
          Annuler l'abonnement
        </h2>
        <p className="text-[#B7B7B7] text-sm mb-4">
          Êtes-vous sûr de vouloir annuler l'abonnement de{" "}
          <strong className="text-[#F9F9F9]">
            {row.display_name || row.email || "ce membre"}
          </strong>{" "}
          ? Le statut passera à &quot;Annulé&quot;.
        </p>
        {error && (
          <p className="text-red-400 text-sm mb-4" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] hover:border-[#50B88A] transition-colors disabled:opacity-50"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Annulation..." : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </>
  );
}
