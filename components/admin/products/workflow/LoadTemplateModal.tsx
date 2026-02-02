"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { WorkflowStepConfig } from "./WorkflowConfigContent";

interface WorkflowTemplate {
  id: string;
  name: string;
  step_count: number;
  created_at: string;
}

interface LoadTemplateModalProps {
  productId: string;
  availableSteps: { id: string }[];
  onApply: (steps: WorkflowStepConfig[]) => void;
  onClose: () => void;
}

export function LoadTemplateModal({
  productId,
  availableSteps,
  onApply,
  onClose,
}: LoadTemplateModalProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        setError(null);
        const response = await fetch("/api/admin/workflow-templates");
        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }
        const data = await response.json();
        setTemplates(data.templates ?? []);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError("Erreur lors du chargement des templates");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleApply = async (templateId: string) => {
    setApplyingId(templateId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/workflow-templates/${templateId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Template non trouvé");
          return;
        }
        throw new Error("Failed to fetch template");
      }

      const data = await response.json();
      const rawSteps = data.template?.steps ?? [];

      if (rawSteps.length === 0) {
        toast.info("Ce template est vide");
        return;
      }

      // Map template steps to WorkflowStepConfig format
      // Ensure step references exist in availableSteps (skip steps that were deleted)
      const availableStepIds = new Set(availableSteps.map((s) => s.id));
      const validSteps = rawSteps.filter((s: { step_id: string }) =>
        availableStepIds.has(s.step_id)
      );

      if (validSteps.length < rawSteps.length) {
        toast.warning(
          `${rawSteps.length - validSteps.length} étape(s) de ce template n'existent plus et ont été ignorées.`
        );
      }

      const mappedSteps: WorkflowStepConfig[] = validSteps.map(
        (
          s: {
            step_id: string;
            position: number;
            is_required: boolean;
            estimated_duration_hours: number | null;
            dossier_status_on_approval: string | null;
            step: unknown;
            document_types: unknown[];
            custom_fields: unknown[];
          },
          index: number
        ) => ({
          id: `temp-${Date.now()}-${s.step_id}-${index}`,
          product_id: productId,
          step_id: s.step_id,
          position: index,
          is_required: s.is_required ?? true,
          estimated_duration_hours: s.estimated_duration_hours ?? null,
          dossier_status_on_approval: s.dossier_status_on_approval ?? null,
          created_at: new Date().toISOString(),
          step: s.step as WorkflowStepConfig["step"],
          document_types:
            s.document_types as WorkflowStepConfig["document_types"],
          custom_fields: s.custom_fields ?? [],
        })
      );

      onApply(mappedSteps);
      toast.success(
        "Template chargé. Cliquez sur « Save & Return » pour appliquer au produit."
      );
      onClose();
    } catch (err) {
      console.error("Error applying template:", err);
      setError("Erreur lors du chargement du template");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Charger un template
          </h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-brand-text-secondary">
              Chargement des templates…
            </p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : templates.length === 0 ? (
            <p className="text-brand-text-secondary">
              Aucun template sauvegardé. Configurez un workflow et utilisez «
              Sauvegarder en template » pour en créer un.
            </p>
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between p-4 bg-brand-dark-bg border border-brand-border rounded-lg hover:border-brand-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-brand-text-primary">
                      {t.name}
                    </p>
                    <p className="text-sm text-brand-text-secondary">
                      {t.step_count} étape{t.step_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApply(t.id)}
                    disabled={applyingId !== null}
                    className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 font-medium text-sm"
                  >
                    {applyingId === t.id ? "Chargement…" : "Appliquer"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
