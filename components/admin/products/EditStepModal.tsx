"use client";

import { useState, useEffect } from "react";
import { Step } from "@/types/products";
import type { FormationSummary } from "@/types/formations";
import { toast } from "sonner";

interface EditStepModalProps {
  step: Step;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  label: string;
  description: string;
  position: number;
  step_type: "CLIENT" | "ADMIN";
}

interface FormErrors {
  label?: string;
  description?: string;
  position?: string;
}

export function EditStepModal({
  step,
  onClose,
  onSuccess,
}: EditStepModalProps) {
  const [formData, setFormData] = useState<FormData>({
    label: step.label,
    description: step.description ?? "",
    position: step.position,
    step_type: step.step_type ?? "CLIENT",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [propagateLoading, setPropagateLoading] = useState(false);
  const [propagateMessage, setPropagateMessage] = useState<string | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);
  const [allFormations, setAllFormations] = useState<FormationSummary[]>([]);
  const [selectedFormationIds, setSelectedFormationIds] = useState<string[]>([]);
  const [formationsLoading, setFormationsLoading] = useState(false);

  useEffect(() => {
    setFormData({
      label: step.label,
      description: step.description ?? "",
      position: step.position,
      step_type: step.step_type ?? "CLIENT",
    });
  }, [step]);

  useEffect(() => {
    let cancelled = false;
    const loadFormations = async () => {
      setFormationsLoading(true);
      try {
        const [allRes, stepRes] = await Promise.all([
          fetch("/api/admin/formations"),
          fetch(`/api/admin/steps/${step.id}/formations`),
        ]);
        if (cancelled) return;
        if (allRes.ok) {
          const allData = await allRes.json();
          setAllFormations(allData.formations ?? []);
        }
        if (stepRes.ok) {
          const stepData = await stepRes.json();
          const ids = (stepData.formations ?? []).map((f: FormationSummary) => f.id);
          setSelectedFormationIds(ids);
        }
      } finally {
        if (!cancelled) setFormationsLoading(false);
      }
    };
    loadFormations();
    return () => {
      cancelled = true;
    };
  }, [step.id]);

  const toggleFormation = (id: string) => {
    setSelectedFormationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const validateLabel = (label: string): string | undefined => {
    if (!label) return "Le libellé est requis";
    if (label.length < 2)
      return "Le libellé doit contenir au moins 2 caractères";
    if (label.length > 100)
      return "Le libellé ne doit pas dépasser 100 caractères";
    return undefined;
  };

  const validateDescription = (d: string): string | undefined => {
    if (d && d.length > 500)
      return "La description ne doit pas dépasser 500 caractères";
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setPropagateMessage(null);
    const labelError = validateLabel(formData.label);
    const descError = validateDescription(formData.description);
    setErrors({
      label: labelError,
      description: descError,
      position: undefined,
    });
    if (labelError || descError) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/steps/${step.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formData.label,
          description: formData.description || null,
          position: formData.position,
          step_type: formData.step_type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la mise à jour");
      setSavedOnce(true);

      const putFormationsRes = await fetch(`/api/admin/steps/${step.id}/formations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_ids: selectedFormationIds }),
      });
      const putFormationsData = await putFormationsRes.json();
      if (!putFormationsRes.ok) {
        toast.error(putFormationsData.error || "Échec de la mise à jour des formations");
      } else {
        toast.success("Step et formations enregistrés");
      }
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePropagate = async () => {
    setPropagateMessage(null);
    setPropagateLoading(true);
    try {
      const res = await fetch(
        `/api/admin/steps/${step.id}/propagate-to-product-steps`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        setPropagateMessage(data.error || "Erreur lors de la répercussion.");
        return;
      }
      const count = data.updatedCount ?? 0;
      if (count === 0) {
        setPropagateMessage("Aucun workflow produit n'utilise cette step.");
      } else {
        setPropagateMessage(
          `Les changements ont été répercutés à ${count} product step(s).`
        );
      }
    } catch (err) {
      setPropagateMessage(
        err instanceof Error ? err.message : "Erreur inattendue"
      );
    } finally {
      setPropagateLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-card z-10">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Modifier la step
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Code (lecture seule)
            </label>
            <input
              type="text"
              value={step.code}
              readOnly
              className="w-full px-3 py-2 bg-brand-dark-bg/50 border border-brand-border rounded-lg text-brand-text-secondary cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Libellé <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, label: e.target.value }))
              }
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  label: validateLabel(formData.label),
                }))
              }
              className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                errors.label ? "border-red-500" : "border-brand-border"
              }`}
            />
            {errors.label && (
              <p className="text-xs text-red-400 mt-1">{errors.label}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
                setErrors((prev) => ({
                  ...prev,
                  description: validateDescription(e.target.value),
                }));
              }}
              rows={3}
              maxLength={500}
              className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none ${
                errors.description ? "border-red-500" : "border-brand-border"
              }`}
            />
            <p className="text-xs text-brand-text-secondary mt-1">
              {formData.description.length}/500
            </p>
            {errors.description && (
              <p className="text-xs text-red-400 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Position
            </label>
            <input
              type="number"
              value={formData.position}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  position: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Type de step
            </label>
            <select
              value={formData.step_type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  step_type: e.target.value as "CLIENT" | "ADMIN",
                }))
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="border-t border-brand-border pt-4">
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Formations à proposer pour cette étape
            </label>
            {formationsLoading ? (
              <p className="text-sm text-brand-text-secondary">Chargement des formations...</p>
            ) : allFormations.length === 0 ? (
              <p className="text-sm text-brand-text-secondary">Aucune formation disponible.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-brand-border p-3 bg-brand-dark-bg">
                {allFormations.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-center gap-2 cursor-pointer text-sm text-brand-text-primary hover:bg-brand-dark-surface/50 rounded px-2 py-1.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFormationIds.includes(f.id)}
                      onChange={() => toggleFormation(f.id)}
                      className="rounded border-brand-border text-brand-accent focus:ring-brand-accent"
                    />
                    <span>{f.titre}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {(savedOnce || true) && (
            <div className="pt-2 border-t border-brand-border">
              <button
                type="button"
                onClick={handlePropagate}
                disabled={propagateLoading}
                className="px-4 py-2 bg-brand-surface-light text-brand-text-primary border border-brand-border rounded-lg hover:bg-brand-dark-bg/50 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {propagateLoading
                  ? "Répercussion..."
                  : "Répercuter aux workflows produits"}
              </button>
              {propagateMessage && (
                <p className="text-sm text-brand-text-secondary mt-2">
                  {propagateMessage}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
