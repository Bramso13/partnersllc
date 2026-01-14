"use client";

import { useRouter } from "next/navigation";

interface RejectionWarningBannerProps {
  rejectedFieldsCount: number;
  dossierId: string;
  stepId?: string;
}

export function RejectionWarningBanner({
  rejectedFieldsCount,
  dossierId,
  stepId,
}: RejectionWarningBannerProps) {
  const router = useRouter();

  const handleNavigateToRejectedStep = () => {
    if (stepId) {
      router.push(`/dossier/${dossierId}?step_id=${stepId}`);
    } else {
      // Navigate to dossier detail page
      router.push(`/dossier/${dossierId}`);
    }
  };

  return (
    <div className="bg-brand-danger/10 border border-brand-danger rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-brand-danger">
              Votre dossier nécessite des corrections
            </p>
            <p className="text-sm text-brand-text-secondary">
              {rejectedFieldsCount} champ{rejectedFieldsCount > 1 ? "s" : ""} à corriger
            </p>
          </div>
        </div>
        <button
          className="px-4 py-2 border border-brand-danger text-brand-danger rounded-lg hover:bg-brand-danger/10 transition-colors"
          onClick={handleNavigateToRejectedStep}
        >
          Voir les corrections
        </button>
      </div>
    </div>
  );
}
