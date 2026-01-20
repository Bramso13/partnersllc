"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { VerificateurStepDetails } from "@/lib/agent-steps";
import { VerificateurDocumentsSection } from "./VerificateurDocumentsSection";
import { StepFieldsSection } from "./StepFieldsSection";
import { CompleteStepSection } from "./CompleteStepSection";
import { StepNotesSection } from "./StepNotesSection";

interface VerificateurStepContentProps {
  stepDetails: VerificateurStepDetails;
  agentId: string;
  isAdmin: boolean;
}

export function VerificateurStepContent({
  stepDetails,
  agentId,
  isAdmin: _isAdmin,
}: VerificateurStepContentProps) {
  const dossierIdShort = stepDetails.dossier.id.slice(0, 8) + "...";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/agent/steps"
              className="p-2 rounded-lg hover:bg-[#2A2B2F] transition-colors text-brand-text-secondary hover:text-brand-text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-brand-text-primary">
                {stepDetails.step.label || stepDetails.step.code}
              </h1>
              {stepDetails.step.description && (
                <p className="text-brand-text-secondary text-sm mt-0.5">
                  {stepDetails.step.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              VERIFICATION
            </span>
            <span className="text-sm text-brand-text-secondary">
              Etape {stepDetails.step.position + 1} sur{" "}
              {stepDetails.dossier.total_steps}
            </span>
          </div>
        </div>

        {/* Context Bar */}
        <div className="border border-[#363636] rounded-xl bg-[#191A1D] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-brand-text-secondary">Produit:</span>{" "}
              <span className="text-brand-text-primary font-medium">
                {stepDetails.dossier.product.name}
              </span>
            </div>
            <div className="h-4 w-px bg-[#363636]" />
            <div>
              <span className="text-brand-text-secondary">Client:</span>{" "}
              <span className="text-brand-text-primary font-medium">
                {stepDetails.dossier.client.full_name || "N/A"}
              </span>
            </div>
            <div className="h-4 w-px bg-[#363636]" />
            <div>
              <span className="text-brand-text-secondary">Dossier:</span>{" "}
              <span className="text-brand-text-primary font-mono text-xs">
                {dossierIdShort}
              </span>
            </div>
            <div className="h-4 w-px bg-[#363636]" />
            <div>
              <span className="text-brand-text-secondary">Statut:</span>{" "}
              <span className="text-amber-400 font-medium">
                {stepDetails.dossier.status}
              </span>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <VerificateurDocumentsSection
          stepInstanceId={stepDetails.id}
          requiredDocuments={stepDetails.required_documents}
          agentId={agentId}
        />

        {/* Client Fields Section */}
        {stepDetails.fields.length > 0 && (
          <StepFieldsSection fields={stepDetails.fields} />
        )}

        {/* Notes Section */}
        <StepNotesSection
          dossierId={stepDetails.dossier_id}
          initialNotes={stepDetails.notes}
          agentId={agentId}
        />

        {/* Complete Step Section */}
        <CompleteStepSection
          stepInstanceId={stepDetails.id}
          requiredDocuments={stepDetails.required_documents}
          isCompleted={!!stepDetails.completed_at}
        />
      </div>
    </div>
  );
}
