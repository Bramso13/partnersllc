"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DossierAllData } from "@/lib/agent/dossiers";
import { DossierStepFieldsSection } from "./DossierStepFieldsSection";
import { DossierDocumentsSection } from "./DossierDocumentsSection";
import { AdminStepCompletionSection } from "./AdminStepCompletionSection";
import { AdminStepWithoutInstance } from "./AdminStepWithoutInstance";


interface DossierDetailContentProps {
  dossierData: DossierAllData;
  agentId: string;
  agentType: "VERIFICATEUR" | "CREATEUR" | null;
}

export function DossierDetailContent({
  dossierData,
  agentId,
  agentType,
}: DossierDetailContentProps) {
  console.log(dossierData, "dossierData//");
  const router = useRouter();
  const dossierIdShort = dossierData.dossier.id.slice(0, 8) + "...";

  // Group steps by type
  const clientSteps = dossierData.step_instances.filter(
    (si) => si.step.step_type === "CLIENT"
  );
  const adminSteps = dossierData.step_instances.filter(
    (si) => si.step.step_type === "ADMIN"
  );

  // Render a step instance
  const renderStepInstance = (stepInstance: DossierAllData["step_instances"][number]) => {
    const isAdminStep = stepInstance.step.step_type === "ADMIN";
    const isAssigned = stepInstance.assigned_to === agentId;
    const canCompleteAdmin = isAdminStep && isAssigned && agentType === "CREATEUR";

    return (
      <div
        key={stepInstance.id}
        className="border border-[#363636] rounded-2xl bg-[#191A1D] overflow-hidden"
      >
        {/* Step Header */}
        <div className="px-5 py-4 border-b border-[#363636]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-brand-text-primary">
                  {stepInstance.step.label || stepInstance.step.code}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {stepInstance.step.step_type}
                </span>
              </div>
              <p className="text-sm text-brand-text-secondary">
                Etape {stepInstance.step.position + 1} - {stepInstance.step.code}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {stepInstance.completed_at ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                  Complété
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  En cours
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-brand-text-secondary">
            {stepInstance.started_at && (
              <span>
                Commencé:{" "}
                {new Date(stepInstance.started_at).toLocaleDateString("fr-FR")}
              </span>
            )}
            {stepInstance.completed_at && (
              <span className="ml-4">
                Complété:{" "}
                {new Date(stepInstance.completed_at).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </div>

        {/* Client Fields Section */}
        {stepInstance.fields.length > 0 && (
          <div className="px-5 py-4">
            <DossierStepFieldsSection fields={stepInstance.fields} />
          </div>
        )}

        {/* Documents Section */}
        {stepInstance.documents && stepInstance.documents.length > 0 && (
          <div className="px-5 py-4 border-t border-[#363636]">
            <DossierDocumentsSection documents={stepInstance.documents} />
          </div>
        )}

        {/* Admin Step Completion Section */}
        {canCompleteAdmin && (
          <div className="px-5 py-4 border-t border-[#363636]">
            <AdminStepCompletionSection
              stepInstanceId={stepInstance.id}
              isCompleted={!!stepInstance.completed_at}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/agent/dossiers"
              className="p-2 rounded-lg hover:bg-[#2A2B2F] transition-colors text-brand-text-secondary hover:text-brand-text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-brand-text-primary">
                Dossier {dossierIdShort}
              </h1>
              <p className="text-brand-text-secondary text-sm mt-0.5">
                {dossierData.client.full_name || "Client"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {dossierData.dossier.status}
            </span>
          </div>
        </div>

        {/* Context Bar */}
        <div className="border border-[#363636] rounded-xl bg-[#191A1D] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {dossierData.product && (
              <>
                <div>
                  <span className="text-brand-text-secondary">Produit:</span>{" "}
                  <span className="text-brand-text-primary font-medium">
                    {dossierData.product.name}
                  </span>
                </div>
                <div className="h-4 w-px bg-[#363636]" />
              </>
            )}
            <div>
              <span className="text-brand-text-secondary">Client:</span>{" "}
              <span className="text-brand-text-primary font-medium">
                {dossierData.client.full_name || "N/A"}
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
                {dossierData.dossier.status}
              </span>
            </div>
          </div>
        </div>

        {/* Steps Sections - Grouped by Type */}
        <div className="space-y-8">
          {/* CLIENT Steps Section */}
          {clientSteps.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-brand-text-primary">
                Étapes CLIENT
              </h2>
              {clientSteps.map(renderStepInstance)}
            </div>
          )}

          {/* ADMIN Steps Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-brand-text-primary">
              Étapes ADMIN
            </h2>
            
            {/* Existing ADMIN step instances */}
            {adminSteps.map(renderStepInstance)}

            {/* ADMIN steps without instances */}
            {dossierData.admin_steps_without_instance.map((adminStep) => (
              <AdminStepWithoutInstance
                key={adminStep.step.id}
                step={adminStep.step}
                dossierId={dossierData.dossier.id}
                agentType={agentType}
                onComplete={() => router.refresh()}
              />
            ))}
          </div>

          {dossierData.step_instances.length === 0 &&
            dossierData.admin_steps_without_instance.length === 0 && (
              <div className="text-center text-brand-text-secondary py-8">
                Aucune étape trouvée pour ce dossier.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
