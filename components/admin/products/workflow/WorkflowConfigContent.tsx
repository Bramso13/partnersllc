"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Step, DocumentType, ProductStep } from "@/types/products";
import { useApi } from "@/lib/api/useApi";
import { WorkflowStepsList } from "./WorkflowStepsList";
import { AddStepModal } from "./AddStepModal";
import { WorkflowPreview } from "./WorkflowPreview";
import { SaveAsTemplateModal } from "./SaveAsTemplateModal";
import { LoadTemplateModal } from "./LoadTemplateModal";

interface WorkflowConfigContentProps {
  productId: string;
}

export interface WorkflowStepConfig extends ProductStep {
  step: Step;
  document_types: DocumentType[];
  custom_fields: unknown[];
}

export function WorkflowConfigContent({
  productId,
}: WorkflowConfigContentProps) {
  const api = useApi();
  const router = useRouter();
  const [steps, setSteps] = useState<WorkflowStepConfig[]>([]);
  const [availableSteps, setAvailableSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);

  const fetchWorkflowConfig = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<{ steps?: WorkflowStepConfig[] }>(
        `/api/admin/products/${productId}/workflow`
      );
      setSteps(data?.steps ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [api, productId]);

  const fetchAvailableSteps = useCallback(async () => {
    try {
      const data = await api.get<{ steps?: Step[] }>("/api/admin/steps");
      setAvailableSteps(data?.steps ?? []);
    } catch {
      // keep current availableSteps
    }
  }, []);

  useEffect(() => {
    fetchWorkflowConfig();
    fetchAvailableSteps();
  }, [fetchWorkflowConfig, fetchAvailableSteps]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const workflowData = {
        steps: steps.map((step, index) => ({
          step_id: step.step_id,
          position: index,
          is_required: step.is_required,
          estimated_duration_hours: step.estimated_duration_hours,
          dossier_status_on_approval: step.dossier_status_on_approval ?? null,
          document_type_ids: step.document_types.map((dt) => dt.id),
          custom_fields: step.custom_fields,
        })),
      };

      await api.post(`/api/admin/products/${productId}/workflow`, workflowData);
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleStepsReordered = (reorderedSteps: WorkflowStepConfig[]) => {
    setSteps(reorderedSteps);
  };

  const handleAddStep = (stepId: string) => {
    const stepToAdd = availableSteps.find((s) => s.id === stepId);
    if (!stepToAdd) return;

    const newStep: WorkflowStepConfig = {
      id: `temp-${Date.now()}`,
      product_id: productId,
      step_id: stepId,
      position: steps.length,
      is_required: true,
      estimated_duration_hours: null,
      dossier_status_on_approval: null,
      created_at: new Date().toISOString(),
      step: stepToAdd,
      document_types: [],
      custom_fields: [],
    };

    setSteps([...steps, newStep]);
    setShowAddModal(false);
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  const handleStepUpdated = (updatedStep: WorkflowStepConfig) => {
    setSteps(steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-text-secondary">
          Loading workflow configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          {steps.length} workflow step{steps.length !== 1 ? "s" : ""} configured
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowLoadTemplateModal(true)}
            className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors"
          >
            Charger un template
          </button>
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            disabled={steps.length === 0}
            className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors disabled:opacity-50"
          >
            Sauvegarder en template
          </button>
          <button
            onClick={() => setShowPreview(true)}
            disabled={steps.length === 0}
            className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors disabled:opacity-50"
          >
            Preview Workflow
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-brand-accent/20 text-brand-accent rounded-lg hover:bg-brand-accent/30 transition-colors font-medium"
          >
            + Add Step
          </button>
          <button
            onClick={handleSave}
            disabled={saving || steps.length === 0}
            className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? "Saving..." : "Save & Return"}
          </button>
        </div>
      </div>

      {/* Workflow Steps List */}
      {steps.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-lg p-8 text-center">
          <p className="text-brand-text-secondary mb-4">
            No workflow steps configured yet. Add your first step to get
            started.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
          >
            + Add First Step
          </button>
        </div>
      ) : (
        <WorkflowStepsList
          steps={steps}
          onReorder={handleStepsReordered}
          onRemove={handleRemoveStep}
          onUpdate={handleStepUpdated}
        />
      )}

      {/* Add Step Modal */}
      {showAddModal && (
        <AddStepModal
          availableSteps={availableSteps}
          selectedStepIds={steps.map((s) => s.step_id)}
          onAdd={handleAddStep}
          onClose={() => setShowAddModal(false)}
          onRefreshSteps={fetchAvailableSteps}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <WorkflowPreview steps={steps} onClose={() => setShowPreview(false)} />
      )}

      {/* Save as Template Modal */}
      {showSaveTemplateModal && (
        <SaveAsTemplateModal
          steps={steps}
          onClose={() => setShowSaveTemplateModal(false)}
        />
      )}

      {/* Load Template Modal */}
      {showLoadTemplateModal && (
        <LoadTemplateModal
          productId={productId}
          availableSteps={availableSteps}
          onApply={setSteps}
          onClose={() => setShowLoadTemplateModal(false)}
        />
      )}
    </div>
  );
}
