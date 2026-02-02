"use client";

import { useState } from "react";
import type { DossierWithDetails, StepInstance, Step } from "@/types/dossiers";
import { StatusChangeDropdown } from "./StatusChangeDropdown";
import { AgentAssignmentDropdown } from "./AgentAssignmentDropdown";
import { DossierAgentAssignmentSection } from "./DossierAgentAssignmentSection";
import { InternalNotesSection } from "./InternalNotesSection";
import { CompleteStepButton } from "./CompleteStepButton";
import { CancelDossierButton } from "./CancelDossierButton";
import { SendDocumentsModal } from "./SendDocumentsModal";
import { DossierConversationButton } from "@/components/admin/conversations/DossierConversationButton";

interface AdminActionsSidebarProps {
  dossier: DossierWithDetails;
  currentStepInstance:
    | (StepInstance & { step?: Step | null })
    | null
    | undefined;
}

const blockClass = "pt-4 first:pt-0 border-t border-[#363636] first:border-t-0";

export function AdminActionsSidebar({
  dossier,
  currentStepInstance,
}: AdminActionsSidebarProps) {
  const [showSendDocumentsModal, setShowSendDocumentsModal] = useState(false);

  const handleSendDocumentsSuccess = () => {
    setShowSendDocumentsModal(false);
    window.location.reload();
  };

  return (
    <div className="sticky top-6">
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-5 space-y-0">
        <div className="pb-4 border-b border-[#363636]">
          <h2 className="text-base font-semibold text-[#f9f9f9]">Actions</h2>
          <p className="text-xs text-[#b7b7b7] mt-0.5">
            Statut, assignations et actions rapides
          </p>
        </div>

        <div className={blockClass}>
          <label className="block text-xs font-medium text-[#b7b7b7] mb-2">
            Statut du dossier
          </label>
          <StatusChangeDropdown
            dossierId={dossier.id}
            currentStatus={dossier.status}
          />
        </div>

        <div className={blockClass}>
          <label className="block text-xs font-medium text-[#b7b7b7] mb-2">
            Assigné à (étape courante)
          </label>
          <AgentAssignmentDropdown
            dossierId={dossier.id}
            currentStepInstance={currentStepInstance}
          />
        </div>

        <div className={blockClass}>
          <h3 className="text-xs font-medium text-[#b7b7b7] mb-3">
            Assignation dossier
          </h3>
          <DossierAgentAssignmentSection dossierId={dossier.id} />
        </div>

        {currentStepInstance && !currentStepInstance.completed_at && (
          <div className={blockClass}>
            <CompleteStepButton
              dossierId={dossier.id}
              stepInstanceId={currentStepInstance.id}
              stepName={currentStepInstance.step?.label || "Étape"}
            />
          </div>
        )}

        {dossier.product_id && (
          <div className={blockClass}>
            <button
              type="button"
              onClick={() => setShowSendDocumentsModal(true)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#50b989] text-[#191a1d] font-medium text-sm hover:bg-[#50b989]/90 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-paper-plane" />
              Envoyer des documents
            </button>
            <p className="text-[10px] text-[#b7b7b7] mt-1.5">
              Livraison manuelle (hors étape)
            </p>
          </div>
        )}

        <div className={blockClass}>
          <DossierConversationButton dossierId={dossier.id} />
        </div>

        <div className={blockClass}>
          <CancelDossierButton
            dossierId={dossier.id}
            currentStatus={dossier.status}
          />
        </div>

        <div className={blockClass}>
          <h3 className="text-xs font-medium text-[#b7b7b7] mb-3">
            Notes internes
          </h3>
          <InternalNotesSection dossierId={dossier.id} />
        </div>
      </div>

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
