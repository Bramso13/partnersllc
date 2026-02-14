"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/lib/api/useApi";
import type { WorkflowStepConfig } from "./WorkflowConfigContent";

interface SaveAsTemplateModalProps {
  steps: WorkflowStepConfig[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function SaveAsTemplateModal({
  steps,
  onClose,
  onSuccess,
}: SaveAsTemplateModalProps) {
  const api = useApi();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Le nom du template est obligatoire");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: trimmedName,
        steps: steps.map((step, index) => ({
          step_id: step.step_id,
          position: index,
          is_required: step.is_required,
          estimated_duration_hours: step.estimated_duration_hours ?? null,
          dossier_status_on_approval: step.dossier_status_on_approval ?? null,
          document_type_ids: step.document_types.map((dt) => dt.id),
          custom_fields: step.custom_fields,
        })),
      };

      await api.post("/api/admin/workflow-templates", payload);
      toast.success("Template sauvegardé avec succès");
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Sauvegarder en template
          </h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="template-name"
              className="block text-sm font-medium text-brand-text-primary mb-2"
            >
              Nom du template
            </label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="ex. LLC Standard, Parcours Banking"
              className="w-full px-3 py-2 rounded-lg bg-brand-dark-bg border border-brand-border text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
              maxLength={100}
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <p className="text-sm text-brand-text-secondary">
            {steps.length} étape{steps.length !== 1 ? "s" : ""} seront
            sauvegardées dans ce template.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
