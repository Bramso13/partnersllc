"use client";

import { useState, useEffect } from "react";
import { SendDocumentsModal } from "./SendDocumentsModal";

interface AdminStepInstance {
  id: string;
  step_id: string;
  dossier_id: string;
  started_at: string | null;
  completed_at: string | null;
  step: {
    id: string;
    label: string;
    description: string | null;
    step_type: "CLIENT" | "ADMIN";
  };
}

interface AdminStepsSectionProps {
  dossierId: string;
  productId: string;
}

export function AdminStepsSection({
  dossierId,
  productId,
}: AdminStepsSectionProps) {
  const [adminSteps, setAdminSteps] = useState<AdminStepInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedStepInstance, setSelectedStepInstance] =
    useState<AdminStepInstance | null>(null);

  const fetchAdminSteps = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/admin-steps`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des étapes admin");
      }

      const data = await response.json();
      setAdminSteps(data.stepInstances || []);
    } catch (err) {
      console.error("Error fetching admin steps:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminSteps();
  }, [dossierId]);

  const handleSendDocuments = (stepInstance: AdminStepInstance) => {
    setSelectedStepInstance(stepInstance);
    setShowSendModal(true);
  };

  const handleModalSuccess = () => {
    fetchAdminSteps();
    setShowSendModal(false);
    setSelectedStepInstance(null);
  };

  const handleModalClose = () => {
    setShowSendModal(false);
    setSelectedStepInstance(null);
  };

  if (loading) {
    return (
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchAdminSteps}
            className="text-brand-accent hover:text-brand-accent-hover"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (adminSteps.length === 0) {
    return null; // Don't show section if no admin steps
  }

  return (
    <>
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Étapes Admin
          </h2>
          <button
            onClick={fetchAdminSteps}
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            title="Actualiser"
          >
            <i className="fa-solid fa-refresh"></i>
          </button>
        </div>

        <div className="space-y-4">
          {adminSteps.map((stepInstance) => {
            const isCompleted = !!stepInstance.completed_at;
            const status = isCompleted ? "Terminé" : "En attente";

            return (
              <div
                key={stepInstance.id}
                className="border border-brand-border rounded-lg p-4 bg-brand-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-brand-text-primary">
                        {stepInstance.step.label}
                      </h3>
                      <span className="px-2 py-1 bg-brand-warning/20 text-brand-warning rounded text-xs font-medium">
                        Admin
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          isCompleted
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    {stepInstance.step.description && (
                      <p className="text-sm text-brand-text-secondary mb-2">
                        {stepInstance.step.description}
                      </p>
                    )}
                    {isCompleted && stepInstance.completed_at && (
                      <p className="text-xs text-brand-text-secondary">
                        Complété le:{" "}
                        {new Date(stepInstance.completed_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    )}
                  </div>
                  {!isCompleted && (
                    <button
                      onClick={() => handleSendDocuments(stepInstance)}
                      className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium ml-4"
                    >
                      <i className="fas fa-paper-plane mr-2"></i>
                      Envoyer des documents
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Send Documents Modal */}
      {showSendModal && selectedStepInstance && (
        <SendDocumentsModal
          dossierId={dossierId}
          productId={productId}
          stepInstanceId={selectedStepInstance.id}
          stepName={selectedStepInstance.step.label}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}
