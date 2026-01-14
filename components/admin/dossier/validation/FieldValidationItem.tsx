"use client";

import { useState } from "react";
import { StepFieldValue } from "./StepValidationSection";
import { toast } from "sonner";

interface FieldValidationItemProps {
  field: StepFieldValue;
  dossierId: string;
  onRefresh: () => void;
}

export function FieldValidationItem({
  field,
  dossierId,
  onRefresh,
}: FieldValidationItemProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/fields/${field.id}/approve`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'approbation");
      }

      toast.success("Champ approuvé");
      onRefresh();
    } catch (err) {
      console.error("Error approving field:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'approbation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectionReason.trim().length < 10) {
      toast.error("La raison du rejet doit contenir au moins 10 caractères");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/fields/${field.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejection_reason: rejectionReason }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du rejet");
      }

      toast.success("Champ rejeté");
      setShowRejectInput(false);
      setRejectionReason("");
      onRefresh();
    } catch (err) {
      console.error("Error rejecting field:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors du rejet");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      APPROVED: { bg: "bg-green-500/20", text: "text-green-400", label: "Approuvé" },
      PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "En attente" },
      REJECTED: { bg: "bg-red-500/20", text: "text-red-400", label: "Rejeté" },
    };

    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatValue = (value: string | null, valueJsonb: Record<string, unknown> | null) => {
    if (valueJsonb) {
      return JSON.stringify(valueJsonb, null, 2);
    }
    return value || "—";
  };

  return (
    <div className="border border-brand-stroke rounded-lg p-4 bg-brand-dark-bg/30">
      <div className="flex items-start justify-between gap-4">
        {/* Field Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-brand-text-primary">
              {field.field_label}
              {field.is_required && <span className="text-red-400 ml-1">*</span>}
            </span>
            {getStatusBadge(field.validation_status)}
          </div>

          <div className="text-sm text-brand-text-secondary mb-2">
            <span className="font-mono bg-brand-dark-surface px-2 py-1 rounded">
              {formatValue(field.value, field.value_jsonb)}
            </span>
          </div>

          {field.rejection_reason && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
              <strong>Raison:</strong> {field.rejection_reason}
            </div>
          )}

          {field.reviewed_at && (
            <div className="text-xs text-brand-text-secondary mt-2">
              Révisé le {new Date(field.reviewed_at).toLocaleDateString('fr-FR')} à{' '}
              {new Date(field.reviewed_at).toLocaleTimeString('fr-FR')}
            </div>
          )}
        </div>

        {/* Actions */}
        {field.validation_status !== "APPROVED" && !showRejectInput && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="px-3 py-1.5 rounded bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fa-solid fa-check mr-1"></i>
                  Approuver
                </>
              )}
            </button>

            <button
              onClick={() => setShowRejectInput(true)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-times mr-1"></i>
              Rejeter
            </button>
          </div>
        )}
      </div>

      {/* Reject Input */}
      {showRejectInput && (
        <div className="mt-4 pt-4 border-t border-brand-stroke">
          <label className="block text-sm font-medium text-brand-text-primary mb-2">
            Raison du rejet (minimum 10 caractères)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Expliquez pourquoi ce champ est rejeté..."
            className="w-full px-3 py-2 bg-brand-dark-surface border border-brand-stroke rounded-lg text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
            rows={3}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-xs ${
                rejectionReason.length >= 10
                  ? "text-green-400"
                  : "text-brand-text-secondary"
              }`}
            >
              {rejectionReason.length} / 10 caractères minimum
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectionReason("");
                }}
                disabled={isLoading}
                className="px-3 py-1.5 rounded text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading || rejectionReason.trim().length < 10}
                className="px-3 py-1.5 rounded bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                    Rejet en cours...
                  </>
                ) : (
                  "Confirmer le rejet"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
