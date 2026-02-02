"use client";

import { useState, useEffect } from "react";
import { Step } from "@/types/products";

const UPPER_SNAKE_CASE_REGEX = /^[A-Z][A-Z0-9_]*$/;

function labelToCode(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");
}

interface CreateStepModalProps {
  onClose: () => void;
  onSuccess: (step: Step) => void;
}

interface FormData {
  code: string;
  label: string;
  description: string;
  position: string;
  step_type: "CLIENT" | "ADMIN";
}

interface FormErrors {
  code?: string;
  label?: string;
  description?: string;
  position?: string;
}

export function CreateStepModal({ onClose, onSuccess }: CreateStepModalProps) {
  const [formData, setFormData] = useState<FormData>({
    code: "",
    label: "",
    description: "",
    position: "",
    step_type: "CLIENT",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (formData.label && !formData.code) {
      setFormData((prev) => ({ ...prev, code: labelToCode(prev.label) }));
    }
  }, [formData.label]);

  const validateCode = async (code: string): Promise<string | undefined> => {
    if (!code) return "Le code est requis";
    if (code.length < 3) return "Le code doit contenir au moins 3 caractères";
    if (code.length > 50) return "Le code ne doit pas dépasser 50 caractères";
    if (!UPPER_SNAKE_CASE_REGEX.test(code)) {
      return "Le code doit être en UPPER_SNAKE_CASE (ex. MA_STEP)";
    }
    setIsValidating(true);
    try {
      const res = await fetch(
        `/api/admin/steps/check-code?code=${encodeURIComponent(code)}`
      );
      const data = await res.json();
      if (data.exists) return "Ce code existe déjà.";
    } catch (err) {
      console.error(err);
    } finally {
      setIsValidating(false);
    }
    return undefined;
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

  const validatePosition = (p: string): string | undefined => {
    if (p && isNaN(parseInt(p, 10))) return "La position doit être un nombre";
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const codeError = await validateCode(formData.code);
    const labelError = validateLabel(formData.label);
    const descError = validateDescription(formData.description);
    const posError = validatePosition(formData.position);
    setErrors({
      code: codeError,
      label: labelError,
      description: descError,
      position: posError,
    });
    if (codeError || labelError || descError || posError) return;

    setIsSubmitting(true);
    try {
      const payload: {
        code: string;
        label: string;
        description?: string;
        position?: number;
        step_type: "CLIENT" | "ADMIN";
      } = {
        code: formData.code,
        label: formData.label,
        step_type: formData.step_type,
      };
      if (formData.description) payload.description = formData.description;
      if (formData.position) payload.position = parseInt(formData.position, 10);

      const res = await fetch("/api/admin/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la création");
      onSuccess(data.step);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-card z-10">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Créer une step
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
              Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              onBlur={async () => {
                const err = await validateCode(formData.code);
                setErrors((prev) => ({ ...prev, code: err }));
              }}
              placeholder="MA_STEP"
              className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                errors.code ? "border-red-500" : "border-brand-border"
              }`}
            />
            {errors.code && (
              <p className="text-xs text-red-400 mt-1">{errors.code}</p>
            )}
            {isValidating && (
              <p className="text-xs text-brand-accent mt-1">
                Vérification du code...
              </p>
            )}
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
              placeholder="Ma step"
              className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent ${
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
              placeholder="Description de la step..."
              rows={3}
              maxLength={500}
              className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none ${
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
              Type de step <span className="text-red-400">*</span>
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

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Position (optionnel)
            </label>
            <input
              type="number"
              value={formData.position}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, position: e.target.value }))
              }
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  position: validatePosition(formData.position),
                }))
              }
              placeholder="Auto si vide"
              className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                errors.position ? "border-red-500" : "border-brand-border"
              }`}
            />
            {errors.position && (
              <p className="text-xs text-red-400 mt-1">{errors.position}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? "Création..." : "Créer la step"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
