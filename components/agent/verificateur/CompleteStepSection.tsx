"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useApi } from "@/lib/api/useApi";
import type { VerificateurStepDetails } from "@/lib/agent-steps";

interface CompleteStepSectionProps {
  stepInstanceId: string;
  requiredDocuments: VerificateurStepDetails["required_documents"];
  isCompleted: boolean;
  /** Si fourni, appelé après complétion au lieu de naviguer vers /agent/steps (ex: vue détail dossier) */
  onCompleted?: () => void;
}

export function CompleteStepSection({
  stepInstanceId,
  requiredDocuments,
  isCompleted,
  onCompleted,
}: CompleteStepSectionProps) {
  const api = useApi();
  const router = useRouter();
  const [manualOverride, setManualOverride] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if all required documents are approved
  const allDocsApproved = requiredDocuments.every(
    (doc) => doc.document?.status === "APPROVED"
  );

  const pendingDocs = requiredDocuments.filter(
    (doc) => !doc.document || doc.document.status === "PENDING"
  );
  const rejectedDocs = requiredDocuments.filter(
    (doc) => doc.document?.status === "REJECTED"
  );
  const notSubmittedDocs = requiredDocuments.filter((doc) => !doc.document);

  const canComplete = allDocsApproved || manualOverride;

  // Build tooltip message
  let tooltipMessage = "";
  if (!allDocsApproved && !manualOverride) {
    const issues: string[] = [];
    if (notSubmittedDocs.length > 0) {
      issues.push(`${notSubmittedDocs.length} document(s) non soumis`);
    }
    if (pendingDocs.length > 0) {
      issues.push(`${pendingDocs.length} document(s) en attente de review`);
    }
    if (rejectedDocs.length > 0) {
      issues.push(`${rejectedDocs.length} document(s) rejete(s)`);
    }
    tooltipMessage = issues.join(", ");
  }

  const handleComplete = async () => {
    if (!canComplete || isLoading) return;

    setIsLoading(true);
    try {
      await api.post(`/api/agent/steps/${stepInstanceId}/complete`, { manual: manualOverride });
      if (onCompleted) {
        onCompleted();
      } else {
        router.push("/agent/steps?completed=true");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la completion");
    } finally {
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
              Etape completee
            </h3>
            <p className="text-sm text-green-300/80">
              Cette etape a ete marquee comme terminee.
            </p>
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
            Completion de l&apos;etape
          </h3>
          {allDocsApproved ? (
            <p className="text-sm text-green-400 mt-1">
              Tous les documents sont approuves. Vous pouvez completer cette etape.
            </p>
          ) : (
            <p className="text-sm text-amber-400 mt-1">
              {tooltipMessage}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Manual Override Checkbox */}
          {!allDocsApproved && (
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={manualOverride}
                onChange={(e) => setManualOverride(e.target.checked)}
                className="w-4 h-4 rounded border-[#363636] bg-[#2A2B2F] text-brand-primary focus:ring-brand-primary/50 cursor-pointer"
              />
              <span className="text-sm text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">
                Completer malgre documents manquants
              </span>
            </label>
          )}

          {/* Complete Button */}
          <div className="relative group">
            <button
              onClick={handleComplete}
              disabled={!canComplete || isLoading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
                canComplete
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-[#2A2B2F] text-brand-text-secondary cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              Marquer comme complete
            </button>

            {/* Tooltip for disabled state */}
            {!canComplete && tooltipMessage && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#2A2B2F] border border-[#363636] rounded-lg text-sm text-brand-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <AlertCircle className="w-4 h-4 inline-block mr-1 text-amber-400" />
                {tooltipMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {manualOverride && !allDocsApproved && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300">
              Attention: Vous completez cette etape manuellement alors que certains
              documents ne sont pas approuves. Cette action sera enregistree dans
              l&apos;historique.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
