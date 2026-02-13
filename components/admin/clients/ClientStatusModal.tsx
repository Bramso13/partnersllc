"use client";

import { useState } from "react";

import { useClients } from "@/lib/contexts/clients/ClientsContext";

interface ClientStatusModalProps {
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientStatusModal({
  clientId,
  onClose,
  onSuccess,
}: ClientStatusModalProps) {
  const { updateClientStatus } = useClients();
  const [status, setStatus] = useState<"PENDING" | "ACTIVE" | "SUSPENDED">(
    "ACTIVE"
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError("Veuillez fournir une raison pour ce changement.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateClientStatus(clientId, status, reason);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#2D3033] rounded-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#F9F9F9]">
            Modifier le statut
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#363636] rounded-lg transition-colors"
          >
            <i className="fa-solid fa-times text-[#B7B7B7]"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F9F9F9] mb-2">
              Nouveau statut
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "PENDING" | "ACTIVE" | "SUSPENDED")
              }
              className="w-full px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] focus:outline-none focus:border-[#50B88A] transition-colors"
            >
              <option value="PENDING">En attente</option>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#F9F9F9] mb-2">
              Raison du changement *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Expliquez pourquoi vous changez le statut..."
              className="w-full px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] placeholder-[#B7B7B7] focus:outline-none focus:border-[#50B88A] transition-colors resize-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              <i className="fa-solid fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] hover:border-[#50B88A] transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[#50B88A] rounded-lg text-white hover:bg-[#4ADE80] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Modification...
                </>
              ) : (
                "Confirmer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
