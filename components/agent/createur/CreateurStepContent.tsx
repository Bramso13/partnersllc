"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CreateurStepDetails } from "@/lib/agent-steps";
import { CreateurDossierDataSection } from "./CreateurDossierDataSection";
import { AdminDocumentUploadSection } from "./AdminDocumentUploadSection";
import { StepNotesSection } from "../verificateur/StepNotesSection";
import { CreateurCompleteStepSection } from "./CreateurCompleteStepSection";

interface CreateurStepContentProps {
  stepDetails: CreateurStepDetails;
  agentId: string;
  isAdmin: boolean;
}

export function CreateurStepContent({
  stepDetails,
  agentId,
  isAdmin: _isAdmin,
}: CreateurStepContentProps) {
  const t = useTranslations("agent.createur");
  const tStep = useTranslations("agent.stepCard");
  const tDossiers = useTranslations("agent.dossiers");
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
              <p className="text-brand-text-secondary text-sm mt-0.5">
                {stepDetails.step.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {tStep("creation")}
            </span>
            <span className="text-sm text-brand-text-secondary">
              {tStep("stepNOf", {
                n: stepDetails.step.position,
                total: stepDetails.dossier.total_steps,
              })}
            </span>
          </div>
        </div>

        {/* Context Bar */}
        <div className="border border-[#363636] rounded-xl bg-[#191A1D] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-brand-text-secondary">
                {tDossiers("product")}:
              </span>{" "}
              <span className="text-brand-text-primary font-medium">
                {stepDetails.dossier.product.name}
              </span>
            </div>
            <div className="h-4 w-px bg-[#363636]" />
            <div>
              <span className="text-brand-text-secondary">
                {tDossiers("client")}:
              </span>{" "}
              <span className="text-brand-text-primary font-medium">
                {stepDetails.dossier.client.full_name}
              </span>
            </div>
            <div className="h-4 w-px bg-[#363636]" />
            <div>
              <span className="text-brand-text-secondary">
                {tDossiers("dossier")}:
              </span>{" "}
              <span className="text-brand-text-primary font-mono text-xs">
                {dossierIdShort}
              </span>
            </div>
            <div className="h-4 w-px bg-[#363636]" />
            <div>
              <span className="text-brand-text-secondary">
                {tDossiers("statusLabel")}:
              </span>{" "}
              <span className="text-amber-400 font-medium">
                {stepDetails.dossier.status}
              </span>
            </div>
          </div>
        </div>

        {/* Section Données Dossier (avec steps précédentes) */}
        <CreateurDossierDataSection
          client={stepDetails.dossier.client}
          product={stepDetails.dossier.product}
          previousStepsData={stepDetails.previous_steps_data}
        />

        {/* Section Upload Documents Admin */}
        <AdminDocumentUploadSection
          stepInstanceId={stepDetails.id}
          adminDocuments={stepDetails.admin_documents}
          agentId={agentId}
          dossierId={stepDetails.dossier.id}
        />

        {/* Notes Internes */}
        <div className="border border-[#363636] rounded-xl bg-[#191A1D] p-6">
          <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
            {t("internalNotes")}
          </h3>
          <StepNotesSection
            dossierId={stepDetails.dossier_id}
            initialNotes={stepDetails.notes}
            agentId={agentId}
          />
        </div>

        {/* Complétion Step */}
        <CreateurCompleteStepSection
          stepInstanceId={stepDetails.id}
          adminDocuments={stepDetails.admin_documents}
          isCompleted={!!stepDetails.completed_at}
        />
      </div>
    </div>
  );
}
