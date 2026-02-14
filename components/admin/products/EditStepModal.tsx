"use client";

import { useState, useEffect } from "react";
import type { Step, StepType } from "@/types/products";
import type {
  FormationSummary,
  StepFormationCustom,
} from "@/types/formations";
import { toast } from "sonner";
import { useApi } from "@/lib/api/useApi";

interface EditStepModalProps {
  step: Step;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  label: string;
  description: string;
  position: number;
  step_type: StepType;
  formation_id: string;
  timer_delay_minutes: string;
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
  const api = useApi();
  const [formData, setFormData] = useState<FormData>({
    label: step.label,
    description: step.description ?? "",
    position: step.position,
    step_type: step.step_type ?? "CLIENT",
    formation_id: step.formation_id ?? "",
    timer_delay_minutes:
      step.timer_delay_minutes != null ? String(step.timer_delay_minutes) : "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [propagateLoading, setPropagateLoading] = useState(false);
  const [propagateMessage, setPropagateMessage] = useState<string | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);
  const [allFormations, setAllFormations] = useState<FormationSummary[]>([]);
  const [selectedFormationIds, setSelectedFormationIds] = useState<string[]>(
    []
  );
  const [formationsLoading, setFormationsLoading] = useState(false);
  const [customFormations, setCustomFormations] = useState<
    StepFormationCustom[]
  >([]);
  const [customFormationsLoading, setCustomFormationsLoading] = useState(false);
  const [customAddTitle, setCustomAddTitle] = useState("");
  const [customAddHtml, setCustomAddHtml] = useState("");
  const [customAddSubmitting, setCustomAddSubmitting] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [editCustomTitle, setEditCustomTitle] = useState("");
  const [editCustomHtml, setEditCustomHtml] = useState("");
  const [editCustomSubmitting, setEditCustomSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      label: step.label,
      description: step.description ?? "",
      position: step.position,
      step_type: step.step_type ?? "CLIENT",
      formation_id: step.formation_id ?? "",
      timer_delay_minutes:
        step.timer_delay_minutes != null
          ? String(step.timer_delay_minutes)
          : "",
    });
  }, [step]);

  useEffect(() => {
    let cancelled = false;
    const loadFormations = async () => {
      setFormationsLoading(true);
      setCustomFormationsLoading(true);
      try {
        const [allData, stepData, customData] = await Promise.all([
          api.get<{ formations?: FormationSummary[] }>("/api/admin/formations"),
          api.get<{ formations?: FormationSummary[] }>(
            `/api/admin/steps/${step.id}/formations`
          ),
          api.get<{ formations?: StepFormationCustom[] }>(
            `/api/admin/steps/${step.id}/formations-custom`
          ),
        ]);
        if (cancelled) return;
        setAllFormations(allData?.formations ?? []);
        const ids = (stepData?.formations ?? []).map((f) => f.id);
        setSelectedFormationIds(ids);
        setCustomFormations(customData?.formations ?? []);
      } catch {
        if (!cancelled) {
          setAllFormations([]);
          setCustomFormations([]);
        }
      } finally {
        if (!cancelled) {
          setFormationsLoading(false);
          setCustomFormationsLoading(false);
        }
      }
    };
    loadFormations();
    return () => {
      cancelled = true;
    };
  }, [api, step.id]);

  const toggleFormation = (id: string) => {
    setSelectedFormationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddCustomFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddTitle.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    setCustomAddSubmitting(true);
    try {
      const data = await api.post<StepFormationCustom>(
        `/api/admin/steps/${step.id}/formations-custom`,
        {
          title: customAddTitle.trim(),
          html_content: customAddHtml,
          position: customFormations.length,
        }
      );
      setCustomFormations((prev) => [...prev, data]);
      setCustomAddTitle("");
      setCustomAddHtml("");
      toast.success("Formation custom ajoutée");
    } finally {
      setCustomAddSubmitting(false);
    }
  };

  const startEditCustom = (c: StepFormationCustom) => {
    setEditingCustomId(c.id);
    setEditCustomTitle(c.title);
    setEditCustomHtml(c.html_content);
  };

  const cancelEditCustom = () => {
    setEditingCustomId(null);
    setEditCustomTitle("");
    setEditCustomHtml("");
  };

  const handleSaveEditCustom = async () => {
    if (!editingCustomId || !editCustomTitle.trim()) return;
    setEditCustomSubmitting(true);
    try {
      const data = await api.put<StepFormationCustom>(
        `/api/admin/steps/${step.id}/formations-custom/${editingCustomId}`,
        {
          title: editCustomTitle.trim(),
          html_content: editCustomHtml,
        }
      );
      setCustomFormations((prev) =>
        prev.map((f) => (f.id === editingCustomId ? data : f))
      );
      cancelEditCustom();
      toast.success("Formation custom mise à jour");
    } finally {
      setEditCustomSubmitting(false);
    }
  };

  const handleDeleteCustom = async (id: string) => {
    if (!confirm("Supprimer cette formation custom ?")) return;
    try {
      await api.delete(
        `/api/admin/steps/${step.id}/formations-custom/${id}`
      );
      setCustomFormations((prev) => prev.filter((f) => f.id !== id));
      if (editingCustomId === id) cancelEditCustom();
      toast.success("Formation custom supprimée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression");
    }
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
      await api.patch(`/api/admin/steps/${step.id}`, {
        label: formData.label,
        description: formData.description || null,
        position: formData.position,
        step_type: formData.step_type,
        formation_id:
          formData.step_type === "FORMATION" && formData.formation_id
            ? formData.formation_id
            : null,
        timer_delay_minutes:
          formData.step_type === "TIMER" && formData.timer_delay_minutes
            ? parseInt(formData.timer_delay_minutes, 10)
            : null,
      });
      setSavedOnce(true);

      try {
        await api.put(`/api/admin/steps/${step.id}/formations`, {
          formation_ids: selectedFormationIds,
        });
        toast.success("Step et formations enregistrés");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Échec de la mise à jour des formations"
        );
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
      const data = await api.post<{ updatedCount?: number }>(
        `/api/admin/steps/${step.id}/propagate-to-product-steps`
      );
      const count = data?.updatedCount ?? 0;
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
                  step_type: e.target.value as StepType,
                }))
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
              <option value="FORMATION">Formation</option>
              <option value="TIMER">Timer (délai)</option>
            </select>
          </div>

          {formData.step_type === "FORMATION" && (
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Formation à suivre (pour cette step)
              </label>
              {formationsLoading ? (
                <p className="text-sm text-brand-text-secondary">
                  Chargement...
                </p>
              ) : (
                <select
                  value={formData.formation_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      formation_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="">Sélectionner une formation</option>
                  {allFormations.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.titre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {formData.step_type === "TIMER" && (
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Délai (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={formData.timer_delay_minutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timer_delay_minutes: e.target.value,
                  }))
                }
                placeholder="Ex. 60"
                className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          )}

          <div className="border-t border-brand-border pt-4">
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Formations à proposer pour cette étape
            </label>
            {formationsLoading ? (
              <p className="text-sm text-brand-text-secondary">
                Chargement des formations...
              </p>
            ) : allFormations.length === 0 ? (
              <p className="text-sm text-brand-text-secondary">
                Aucune formation disponible.
              </p>
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

          <div className="border-t border-brand-border pt-4">
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Formations custom (page HTML par étape)
            </label>
            {customFormationsLoading ? (
              <p className="text-sm text-brand-text-secondary">
                Chargement...
              </p>
            ) : (
              <>
                <ul className="space-y-2 mb-4">
                  {customFormations.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 rounded-lg border border-brand-border p-2 bg-brand-dark-bg"
                    >
                      {editingCustomId === c.id ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editCustomTitle}
                            onChange={(e) =>
                              setEditCustomTitle(e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm bg-brand-dark-bg border border-brand-border rounded text-brand-text-primary"
                            placeholder="Titre"
                          />
                          <textarea
                            value={editCustomHtml}
                            onChange={(e) =>
                              setEditCustomHtml(e.target.value)
                            }
                            rows={4}
                            className="w-full px-2 py-1.5 text-sm bg-brand-dark-bg border border-brand-border rounded text-brand-text-primary font-mono"
                            placeholder="Contenu HTML"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleSaveEditCustom}
                              disabled={editCustomSubmitting}
                              className="px-2 py-1 text-sm bg-brand-accent text-white rounded"
                            >
                              {editCustomSubmitting
                                ? "Enregistrement..."
                                : "Enregistrer"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditCustom}
                              className="px-2 py-1 text-sm border border-brand-border rounded text-brand-text-primary"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-brand-text-primary truncate">
                            {c.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditCustom(c)}
                            className="text-sm text-brand-accent hover:underline"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustom(c.id)}
                            className="text-sm text-red-400 hover:underline"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <form
                  onSubmit={handleAddCustomFormation}
                  className="space-y-2 p-3 rounded-lg border border-brand-border bg-brand-dark-bg/50"
                >
                  <p className="text-xs text-brand-text-secondary mb-2">
                    Ajouter une formation custom (titre + HTML)
                  </p>
                  <input
                    type="text"
                    value={customAddTitle}
                    onChange={(e) => setCustomAddTitle(e.target.value)}
                    placeholder="Titre de la formation"
                    className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary text-sm"
                  />
                  <textarea
                    value={customAddHtml}
                    onChange={(e) => setCustomAddHtml(e.target.value)}
                    rows={5}
                    placeholder="Contenu HTML (styles, images, vidéos, liens...)"
                    className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary text-sm font-mono"
                  />
                  <button
                    type="submit"
                    disabled={customAddSubmitting}
                    className="px-3 py-2 text-sm bg-brand-accent text-white rounded-lg disabled:opacity-50"
                  >
                    {customAddSubmitting
                      ? "Ajout..."
                      : "Ajouter la formation custom"}
                  </button>
                </form>
              </>
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
