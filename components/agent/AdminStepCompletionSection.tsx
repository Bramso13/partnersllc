"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, Loader2 } from "lucide-react";

interface AdminStepCompletionSectionProps {
  stepInstanceId: string;
  isCompleted: boolean;
}

export function AdminStepCompletionSection({
  stepInstanceId,
  isCompleted,
}: AdminStepCompletionSectionProps) {
  const router = useRouter();
  const t = useTranslations("agent.adminStepCompletion");
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (isCompleted || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/agent/steps/${stepInstanceId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual: false }),
      });

      if (res.ok) {
        // Refresh the page to show updated status
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || t("completionError"));
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error completing step", err);
      alert(t("completionError"));
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="border border-green-500/30 rounded-2xl bg-green-500/10 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <div>
            <h3 className="text-lg font-semibold text-green-300">
              {t("stepCompleted")}
            </h3>
            <p className="text-sm text-green-300/80">{t("stepMarkedDone")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#363636] rounded-2xl bg-[#191A1D] p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary">
            {t("adminStepCompletion")}
          </h3>
          <p className="text-sm text-brand-text-secondary mt-1">
            {t("markAdminComplete")}
          </p>
        </div>

        <button
          onClick={handleComplete}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {t("markComplete")}
        </button>
      </div>
    </div>
  );
}
