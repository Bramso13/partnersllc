"use client";

import { useState } from "react";

interface RejectionModalProps {
  title: string;
  message: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] placeholder-[#b7b7b7]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#50b989] resize-none";

export function RejectionModal({
  title,
  message,
  onConfirm,
  onCancel,
}: RejectionModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (reason.trim().length < 10) return;
    try {
      setIsSubmitting(true);
      await onConfirm(reason);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-[#f9f9f9] mb-2">{title}</h3>
        <p className="text-sm text-[#b7b7b7] mb-4">{message}</p>
        <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
          Raison du rejet (min. 10 caractères)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Expliquez le rejet…"
          rows={3}
          className={inputClass}
          disabled={isSubmitting}
          autoFocus
        />
        <p
          className={`text-[10px] mt-1.5 ${
            reason.length >= 10 ? "text-emerald-400" : "text-[#b7b7b7]"
          }`}
        >
          {reason.length} / 10
        </p>
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#363636] text-[#f9f9f9] text-sm hover:bg-[#363636]/50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || reason.trim().length < 10}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2" />
                Rejet…
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
