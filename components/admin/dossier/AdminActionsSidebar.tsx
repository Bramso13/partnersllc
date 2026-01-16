"use client";

import { useState } from "react";
import { DossierWithDetails, StepInstance, Step } from "@/lib/dossiers";
import { StatusChangeDropdown } from "./StatusChangeDropdown";
import { AgentAssignmentDropdown } from "./AgentAssignmentDropdown";
import { InternalNotesSection } from "./InternalNotesSection";
import { CompleteStepButton } from "./CompleteStepButton";
import { CancelDossierButton } from "./CancelDossierButton";
import { SendDocumentsModal } from "./SendDocumentsModal";

interface AdminActionsSidebarProps {
  dossier: DossierWithDetails;
  currentStepInstance: (StepInstance & { step?: Step | null }) | null | undefined;
}

export function AdminActionsSidebar({
  dossier,
  currentStepInstance,
}: AdminActionsSidebarProps) {
  const [showSendDocumentsModal, setShowSendDocumentsModal] = useState(false);

  const handleSendDocumentsSuccess = () => {
    setShowSendDocumentsModal(false);
    // Optionally refresh the page or show a success message
    window.location.reload();
  };

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

        {/* Send Documents Button (Manual Delivery) */}
        {dossier.product_id && (
          <div className="border-t border-brand-stroke pt-4">
            <button
              onClick={() => setShowSendDocumentsModal(true)}
              className="w-full px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Envoyer des documents
            </button>
            <p className="text-xs text-brand-text-secondary mt-2">
              Envoyer des documents au client (non liés à une étape)
            </p>
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

      {/* Send Documents Modal (Manual Delivery) */}
      {showSendDocumentsModal && dossier.product_id && (
        <SendDocumentsModal
          dossierId={dossier.id}
          productId={dossier.product_id}
          onClose={() => setShowSendDocumentsModal(false)}
          onSuccess={handleSendDocumentsSuccess}
        />
      )}
    </div>
  );
}
