"use client";

import { useState } from "react";
import { StepFieldValue } from "./StepValidationSection";
import { toast } from "sonner";
import { useApi } from "@/lib/api/useApi";

const SIMPLIFIED_VALIDATION = true;

interface FieldValidationItemProps {
  field: StepFieldValue;
  dossierId: string;
  onRefresh: () => void;
}

const statusStyles: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  APPROVED: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    label: "Approuvé",
  },
  PENDING: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    label: "En attente",
  },
  REJECTED: { bg: "bg-red-500/20", text: "text-red-400", label: "Rejeté" },
};

function formatValue(
  value: string | null,
  valueJsonb: Record<string, unknown> | null
) {
  if (valueJsonb) return JSON.stringify(valueJsonb, null, 2);
  return value ?? "—";
}

export function FieldValidationItem({
  field,
  dossierId,
  onRefresh,
}: FieldValidationItemProps) {
  const api = useApi();
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const status = statusStyles[field.validation_status] ?? statusStyles.PENDING;

  const handleApprove = async () => {
    try {
      setLoading(true);
      await api.post(
        `/api/admin/dossiers/${dossierId}/fields/${field.id}/approve`
      );
      toast.success("Champ approuvé");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectionReason.trim().length < 10) {
      toast.error("Raison du rejet : au moins 10 caractères");
      return;
    }
    try {
      setLoading(true);
      await api.post(
        `/api/admin/dossiers/${dossierId}/fields/${field.id}/reject`,
        { rejection_reason: rejectionReason }
      );
      toast.success("Champ rejeté");
      setShowReject(false);
      setRejectionReason("");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-[#1e1f22] border border-[#363636] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[#f9f9f9]">
              {field.field_label}
              {field.is_required && (
                <span className="text-red-400 ml-0.5">*</span>
              )}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.text}`}
            >
              {status.label}
            </span>
          </div>
          <pre className="text-xs text-[#b7b7b7] bg-[#252628] px-2 py-1.5 rounded overflow-x-auto whitespace-pre-wrap break-words font-mono">
            {formatValue(field.value, field.value_jsonb)}
          </pre>
          {field.rejection_reason && (
            <p className="mt-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">
              {field.rejection_reason}
            </p>
          )}
          {field.reviewed_at && (
            <p className="text-[10px] text-[#b7b7b7] mt-1">
              Révisé le {new Date(field.reviewed_at).toLocaleString("fr-FR")}
            </p>
          )}
        </div>
        {!SIMPLIFIED_VALIDATION &&
          field.validation_status !== "APPROVED" &&
          !showReject && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading}
                className="px-2.5 py-1.5 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <i className="fa-solid fa-spinner fa-spin" />
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-1" />
                    Approuver
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowReject(true)}
                disabled={loading}
                className="px-2.5 py-1.5 rounded bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30"
              >
                Rejeter
              </button>
            </div>
          )}
      </div>
      {!SIMPLIFIED_VALIDATION && showReject && (
        <div className="mt-3 pt-3 border-t border-[#363636]">
          <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
            Raison du rejet (min. 10 caractères)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Expliquez le rejet…"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-xs placeholder-[#b7b7b7]/60 focus:outline-none focus:ring-2 focus:ring-[#50b989] resize-none"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-[10px] ${
                rejectionReason.length >= 10
                  ? "text-emerald-400"
                  : "text-[#b7b7b7]"
              }`}
            >
              {rejectionReason.length}/10
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowReject(false);
                  setRejectionReason("");
                }}
                disabled={loading}
                className="px-2 py-1 rounded text-xs text-[#b7b7b7] hover:text-[#f9f9f9]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading || rejectionReason.trim().length < 10}
                className="px-2 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Confirmer rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
