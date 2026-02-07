"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminStepWithoutInstanceProps {
  step: {
    id: string;
    label: string | null;
    code: string;
    position: number;
    step_type: "ADMIN";
  };
  dossierId: string;
  agentType: "VERIFICATEUR" | "CREATEUR" | null;
  onComplete: () => void;
}

export function AdminStepWithoutInstance({
  step,
  dossierId,
  agentType,
  onComplete,
}: AdminStepWithoutInstanceProps) {
  const t = useTranslations("agent.adminStepWithoutInstance");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (agentType !== "CREATEUR") {
      toast.error(t("onlyCreateur"));
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/agent/steps/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossier_id: dossierId,
          step_id: step.id,
        }),
      });

      if (res.ok) {
        toast.success(t("stepCreated"));
        onComplete();
      } else {
        const error = await res.json();
        toast.error(error.error || t("createError"));
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error creating step", err);
      toast.error(t("createError"));
      setIsLoading(false);
    }
  };

  const canComplete = agentType === "CREATEUR";

  return (
    <div className="border border-[#363636] rounded-2xl bg-[#191A1D] overflow-hidden opacity-75">
      {/* Step Header */}
      <div className="px-5 py-4 border-b border-[#363636]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-brand-text-primary">
                {step.label || step.code}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {step.step_type}
              </span>
            </div>
            <p className="text-sm text-brand-text-secondary">
              {step.position + 1} - {step.code}
            </p>
            <p className="text-xs text-amber-400 mt-2 italic">
              {t("notStarted")}
            </p>
          </div>
        </div>
      </div>

      {/* Completion Section */}
      <div className="px-5 py-4">
        <div className="border border-[#363636] rounded-2xl bg-[#191A1D] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-brand-text-primary">
                {t("startAdminStep")}
              </h3>
              <p className="text-sm text-brand-text-secondary mt-1">
                {canComplete
                  ? t("createToStart")
                  : t("onlyCreateurCanCreate")}
              </p>
            </div>

            {canComplete && (
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {t("start")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
