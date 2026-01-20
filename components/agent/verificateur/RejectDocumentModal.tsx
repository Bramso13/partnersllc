"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface RejectDocumentModalProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const MIN_REASON_LENGTH = 10;

export function RejectDocumentModal({
  onConfirm,
  onCancel,
  isLoading,
}: RejectDocumentModalProps) {
  const [reason, setReason] = useState("");

  const isValid = reason.trim().length >= MIN_REASON_LENGTH;

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      onConfirm(reason.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => !isLoading && onCancel()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#191A1D] rounded-2xl border border-[#363636] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363636]">
          <h3 className="text-lg font-semibold text-brand-text-primary">
            Rejeter le document
          </h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-[#2A2B2F] text-brand-text-secondary hover:text-brand-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="reject-reason"
              className="block text-sm font-medium text-brand-text-primary mb-2"
            >
              Raison du rejet <span className="text-red-400">*</span>
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez pourquoi ce document est rejete (minimum 10 caracteres)..."
              rows={4}
              className="w-full px-4 py-3 bg-[#2A2B2F] border border-[#363636] rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary resize-none"
              disabled={isLoading}
              autoFocus
            />
            <div className="mt-1 flex justify-between text-xs">
              <span
                className={
                  reason.trim().length < MIN_REASON_LENGTH
                    ? "text-red-400"
                    : "text-green-400"
                }
              >
                {reason.trim().length} / {MIN_REASON_LENGTH} caracteres minimum
              </span>
            </div>
          </div>

          <p className="text-sm text-brand-text-secondary">
            Le client sera notifie et pourra soumettre une nouvelle version du
            document.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-[#2A2B2F] hover:bg-[#363636] text-brand-text-secondary hover:text-brand-text-primary transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmer le rejet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
