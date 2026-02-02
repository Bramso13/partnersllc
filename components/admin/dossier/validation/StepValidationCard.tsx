"use client";

import { useState } from "react";
import { StepInstanceWithFields } from "./StepValidationSection";
import { toast } from "sonner";
import { FieldValidationList } from "./FieldValidationList";
import { DocumentValidationList } from "./DocumentValidationList";
import { RejectionModal } from "./RejectionModal";

const SIMPLIFIED_VALIDATION = true;

interface StepValidationCardProps {
  stepInstance: StepInstanceWithFields;
  onRefresh: () => void;
}

const statusBadges: Record<
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
  SUBMITTED: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Soumis" },
  UNDER_REVIEW: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    label: "En révision",
  },
  DRAFT: { bg: "bg-[#363636]", text: "text-[#b7b7b7]", label: "Brouillon" },
};

export function StepValidationCard({
  stepInstance,
  onRefresh,
}: StepValidationCardProps) {
  const [isExpanded, setIsExpanded] = useState(
    stepInstance.validation_status === "SUBMITTED" ||
      stepInstance.validation_status === "UNDER_REVIEW"
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const hasFields = stepInstance.total_fields_count > 0;
  const hasDocuments = stepInstance.total_documents_count > 0;
  const allFieldsOk =
    !hasFields ||
    stepInstance.approved_fields_count === stepInstance.total_fields_count;
  const allDocsOk =
    !hasDocuments ||
    stepInstance.approved_documents_count ===
      stepInstance.total_documents_count;
  const canApprove = (hasFields || hasDocuments) && allFieldsOk && allDocsOk;

  const getBadge = (status: string) => {
    const b = statusBadges[status] ?? statusBadges.DRAFT;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${b.bg} ${b.text}`}
      >
        {b.label}
      </span>
    );
  };

  const handleApproveStep = async () => {
    if (!SIMPLIFIED_VALIDATION && !canApprove) {
      if (hasFields && !allFieldsOk) {
        toast.error("Tous les champs doivent être approuvés");
        return;
      }
      if (hasDocuments && !allDocsOk) {
        toast.error("Tous les documents doivent être approuvés");
        return;
      }
    }

    try {
      setIsApproving(true);
      if (SIMPLIFIED_VALIDATION) {
        for (const f of stepInstance.fields.filter(
          (f) => f.validation_status !== "APPROVED"
        )) {
          await fetch(
            `/api/admin/dossiers/${stepInstance.dossier_id}/fields/${f.id}/approve`,
            { method: "POST" }
          );
        }
        for (const d of stepInstance.documents.filter(
          (d) => d.status !== "APPROVED"
        )) {
          await fetch(
            `/api/admin/dossiers/${stepInstance.dossier_id}/documents/${d.id}/approve`,
            { method: "POST" }
          );
        }
      }
      const res = await fetch(
        `/api/admin/dossiers/${stepInstance.dossier_id}/steps/${stepInstance.id}/approve`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur approbation");
      }
      toast.success("Étape validée");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur approbation");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectStep = async (reason: string) => {
    try {
      const res = await fetch(
        `/api/admin/dossiers/${stepInstance.dossier_id}/steps/${stepInstance.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejection_reason: reason }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur rejet");
      }
      toast.success("Étape rejetée");
      setShowRejectModal(false);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur rejet");
    }
  };

  return (
    <>
      <div className="rounded-lg bg-[#1e1f22] border border-[#363636] overflow-hidden">
        <button
          type="button"
          className="w-full p-4 text-left hover:bg-[#252628]/50 transition-colors flex items-start justify-between gap-3"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-[#f9f9f9]">
                {stepInstance.step_label}
              </h3>
              {getBadge(stepInstance.validation_status)}
            </div>
            {stepInstance.step_description && (
              <p className="text-xs text-[#b7b7b7] mb-2">
                {stepInstance.step_description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#b7b7b7]">
              <span>
                <strong className="text-[#50b989]">
                  {stepInstance.approved_fields_count}
                </strong>
                /{stepInstance.total_fields_count} champs
              </span>
              {stepInstance.total_documents_count > 0 && (
                <span>
                  <strong className="text-[#50b989]">
                    {stepInstance.approved_documents_count}
                  </strong>
                  /{stepInstance.total_documents_count} docs
                </span>
              )}
              {stepInstance.validated_at && (
                <span>
                  Validé le{" "}
                  {new Date(stepInstance.validated_at).toLocaleDateString(
                    "fr-FR"
                  )}
                </span>
              )}
            </div>
            {stepInstance.rejection_reason && (
              <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {stepInstance.rejection_reason}
              </div>
            )}
          </div>
          <i
            className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"} text-[#b7b7b7] shrink-0 mt-0.5`}
          />
        </button>

        {isExpanded && (
          <div className="border-t border-[#363636] p-4 bg-[#252628]/30 space-y-4">
            {stepInstance.fields.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[#f9f9f9] mb-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-list" />
                  Champs
                </h4>
                <FieldValidationList
                  dossierId={stepInstance.dossier_id}
                  fields={stepInstance.fields}
                  onRefresh={onRefresh}
                />
              </div>
            )}
            {stepInstance.documents.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[#f9f9f9] mb-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-file" />
                  Documents
                </h4>
                <DocumentValidationList
                  dossierId={stepInstance.dossier_id}
                  documents={stepInstance.documents}
                  onRefresh={onRefresh}
                />
              </div>
            )}
            {(stepInstance.validation_status === "SUBMITTED" ||
              stepInstance.validation_status === "UNDER_REVIEW") && (
              <div className="pt-4 border-t border-[#363636] flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleApproveStep}
                  disabled={
                    SIMPLIFIED_VALIDATION
                      ? isApproving
                      : !canApprove || isApproving
                  }
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isApproving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" />
                      Validation…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check" />
                      Valider l’étape
                    </>
                  )}
                </button>
                {!SIMPLIFIED_VALIDATION && (
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                  >
                    <i className="fa-solid fa-times mr-2" />
                    Rejeter
                  </button>
                )}
                {!SIMPLIFIED_VALIDATION && !canApprove && (
                  <span className="text-xs text-[#b7b7b7]">
                    Approuvez tous les champs et documents avant de valider.
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!SIMPLIFIED_VALIDATION && showRejectModal && (
        <RejectionModal
          title="Rejeter l’étape"
          message="Indiquez la raison du rejet (le client la recevra)."
          onConfirm={handleRejectStep}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}
