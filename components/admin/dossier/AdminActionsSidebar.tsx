"use client";

import { useState } from "react";
import { DossierWithDetails, StepInstance, Step } from "@/lib/dossiers";
import { StatusChangeDropdown } from "./StatusChangeDropdown";
import { AgentAssignmentDropdown } from "./AgentAssignmentDropdown";
import { InternalNotesSection } from "./InternalNotesSection";
import { CompleteStepButton } from "./CompleteStepButton";
import { CancelDossierButton } from "./CancelDossierButton";

interface AdminActionsSidebarProps {
  dossier: DossierWithDetails;
  currentStepInstance: (StepInstance & { step?: Step | null }) | null | undefined;
}

export function AdminActionsSidebar({
  dossier,
  currentStepInstance,
}: AdminActionsSidebarProps) {
  return (
    <div className="sticky top-6">
      <div className="bg-brand-surface-light border border-brand-stroke rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
            Actions Admin
          </h2>
        </div>

        {/* Status Change */}
        <div className="border-t border-brand-stroke pt-4">
          <label className="block text-sm font-medium text-brand-text-secondary mb-2">
            Statut
          </label>
          <StatusChangeDropdown
            dossierId={dossier.id}
            currentStatus={dossier.status}
          />
        </div>

        {/* Agent Assignment */}
        <div className="border-t border-brand-stroke pt-4">
          <label className="block text-sm font-medium text-brand-text-secondary mb-2">
            Assigné à
          </label>
          <AgentAssignmentDropdown
            dossierId={dossier.id}
            currentStepInstance={currentStepInstance}
          />
        </div>

        {/* Complete Step Button */}
        {currentStepInstance && !currentStepInstance.completed_at && (
          <div className="border-t border-brand-stroke pt-4">
            <CompleteStepButton
              dossierId={dossier.id}
              stepInstanceId={currentStepInstance.id}
              stepName={currentStepInstance.step?.label || "Étape"}
            />
          </div>
        )}

        {/* Cancel Dossier Button */}
        <div className="border-t border-brand-stroke pt-4">
          <CancelDossierButton
            dossierId={dossier.id}
            currentStatus={dossier.status}
          />
        </div>

        {/* Internal Notes */}
        <div className="border-t border-brand-stroke pt-4">
          <h3 className="text-sm font-medium text-brand-text-secondary mb-3">
            Notes internes
          </h3>
          <InternalNotesSection dossierId={dossier.id} />
        </div>
      </div>
    </div>
  );
}
