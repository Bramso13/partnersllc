"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useApi } from "@/lib/api/useApi";
import type { CreateurStepDetails } from "@/lib/agent-steps";

interface CreateurCompleteStepSectionProps {
  stepInstanceId: string;
  adminDocuments: CreateurStepDetails["admin_documents"];
  isCompleted: boolean;
}

export function CreateurCompleteStepSection({
  stepInstanceId,
  adminDocuments,
  isCompleted,
}: CreateurCompleteStepSectionProps) {
  const api = useApi();
  const t = useTranslations("agent.createur");
  const [completing, setCompleting] = useState(false);

  // Vérifier si tous les documents requis sont livrés
  const allDocumentsDelivered = adminDocuments.every(
    (doc) => doc.document?.status === "DELIVERED"
  );

  const handleComplete = async () => {
    if (!allDocumentsDelivered) return;

    setCompleting(true);

    try {
      await api.post(`/api/agent/steps/${stepInstanceId}/complete`, {
        agent_type: "CREATEUR",
      });
      window.location.href = "/agent/steps";
    } catch (e) {
      alert(e instanceof Error ? e.message : t("completionError"));
    } finally {
      setCompleting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="border border-[#363636] rounded-xl bg-[#191A1D] p-6">
        <div className="flex items-center gap-3 text-green-400">
          <CheckCircle className="w-6 h-6" />
          <h3 className="text-lg font-semibold">{t("stepCompleted")}</h3>
        </div>
        <p className="text-brand-text-secondary text-sm mt-2">
          {t("allCreatedAndDelivered")}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#363636] rounded-xl bg-[#191A1D] p-6">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
        {t("stepCompletion")}
      </h3>

      {/* Vérifications */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          {allDocumentsDelivered ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span
            className={`text-sm ${allDocumentsDelivered ? "text-green-400" : "text-red-400"}`}
          >
            {t("allDocsDelivered")}
          </span>
        </div>

        {!allDocumentsDelivered && (
          <div className="ml-8 text-sm text-brand-text-secondary">
            {t("missingOrNotDelivered")}
            <ul className="list-disc list-inside mt-1">
              {adminDocuments
                .filter(
                  (doc) => !doc.document || doc.document.status !== "DELIVERED"
                )
                .map((doc) => (
                  <li key={doc.document_type.id}>{doc.document_type.label}</li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* Bouton de complétion */}
      <button
        onClick={handleComplete}
        disabled={!allDocumentsDelivered || completing}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          allDocumentsDelivered && !completing
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-[#363636] text-brand-text-secondary cursor-not-allowed"
        }`}
      >
        {completing
          ? t("completing")
          : allDocumentsDelivered
            ? t("markComplete")
            : t("cannotComplete")}
      </button>

      {!allDocumentsDelivered && (
        <p className="text-brand-text-secondary text-xs text-center mt-2">
          {t("allMustBeUploaded")}
        </p>
      )}
    </div>
  );
}
