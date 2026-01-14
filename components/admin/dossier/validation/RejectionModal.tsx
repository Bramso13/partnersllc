"use client";

import { useState } from "react";

interface RejectionModalProps {
  title: string;
  message: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export function RejectionModal({
  title,
  message,
  onConfirm,
  onCancel,
}: RejectionModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (rejectionReason.trim().length < 10) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(rejectionReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
          {title}
        </h3>
        <p className="text-brand-text-secondary mb-4">{message}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-brand-text-primary mb-2">
            Raison du rejet (minimum 10 caractères)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Expliquez pourquoi cette étape est rejetée..."
            className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-stroke rounded-lg text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
            rows={4}
            disabled={isSubmitting}
            autoFocus
          />
          <div className="mt-2">
            <span
              className={`text-xs ${
                rejectionReason.length >= 10
                  ? "text-green-400"
                  : "text-brand-text-secondary"
              }`}
            >
              {rejectionReason.length} / 10 caractères minimum
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || rejectionReason.trim().length < 10}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Rejet en cours...
              </>
            ) : (
              "Confirmer le rejet"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
