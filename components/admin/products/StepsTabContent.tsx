"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Step } from "@/types/products";
import { useApi } from "@/lib/api/useApi";
import { CreateStepModal } from "./CreateStepModal";
import { EditStepModal } from "./EditStepModal";
import { CustomFieldModal } from "./workflow/CustomFieldModal";
import type { StepField, DocumentType } from "@/types/products";

interface StepDocumentTypeRow {
  id: string;
  step_id: string;
  document_type_id: string;
  document_type?: DocumentType;
}

export function StepsTabContent() {
  const api = useApi();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [stepFields, setStepFields] = useState<Record<string, StepField[]>>({});
  const [stepDocTypes, setStepDocTypes] = useState<
    Record<string, StepDocumentTypeRow[]>
  >({});
  const [loadingConfig, setLoadingConfig] = useState<Record<string, boolean>>(
    {}
  );
  const [showFieldModal, setShowFieldModal] = useState<{
    stepId: string;
    field?: StepField;
  } | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [addingDocTypeStepId, setAddingDocTypeStepId] = useState<string | null>(
    null
  );

  const fetchSteps = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<{ steps?: Step[] }>("/api/admin/steps");
      setSteps(data?.steps ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const fetchStepConfig = useCallback(async (stepId: string) => {
    setLoadingConfig((prev) => ({ ...prev, [stepId]: true }));
    try {
      const [fieldsData, docTypesData] = await Promise.all([
        api.get<{ fields?: StepField[] }>(`/api/admin/steps/${stepId}/fields`),
        api.get<{ document_types?: StepDocumentTypeRow[] }>(
          `/api/admin/steps/${stepId}/document-types`
        ),
      ]);
      setStepFields((prev) => ({
        ...prev,
        [stepId]: fieldsData?.fields ?? [],
      }));
      setStepDocTypes((prev) => ({
        ...prev,
        [stepId]: docTypesData?.document_types ?? [],
      }));
    } catch {
      // keep previous config
    } finally {
      setLoadingConfig((prev) => ({ ...prev, [stepId]: false }));
    }
  }, []);

  useEffect(() => {
    if (expandedStepId) {
      fetchStepConfig(expandedStepId);
    }
  }, [expandedStepId, fetchStepConfig]);

  useEffect(() => {
    if (!showFieldModal && !addingDocTypeStepId) return;
    let cancelled = false;
    api
      .get<{ documentTypes?: DocumentType[] }>("/api/admin/document-types")
      .then((d) => {
        if (!cancelled) setDocumentTypes(d?.documentTypes ?? []);
      })
      .catch(() => {
        if (!cancelled) setDocumentTypes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [api, showFieldModal, addingDocTypeStepId]);

  const handleCreateSuccess = (step: Step) => {
    setShowCreateModal(false);
    setSteps((prev) => [...prev, step]);
  };

  const handleEditSuccess = () => {
    fetchSteps();
    setEditingStep(null);
  };

  const handleDeleteStep = async (step: Step) => {
    if (
      !window.confirm(
        `Supprimer la step « ${step.label} » ? Cette action est irréversible si la step n'est utilisée par aucun produit.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/api/admin/steps/${step.id}`);
      setSteps((prev) => prev.filter((s) => s.id !== step.id));
      if (expandedStepId === step.id) setExpandedStepId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  };

  const toggleExpand = (stepId: string) => {
    setExpandedStepId((prev) => (prev === stepId ? null : stepId));
  };

  const handleFieldSaved = () => {
    if (showFieldModal?.stepId) {
      fetchStepConfig(showFieldModal.stepId);
      setShowFieldModal(null);
    }
  };

  const handleAddDocumentType = async (
    stepId: string,
    documentTypeId: string
  ) => {
    try {
      await api.post(`/api/admin/steps/${stepId}/document-types`, {
        document_type_id: documentTypeId,
      });
      await fetchStepConfig(stepId);
      setAddingDocTypeStepId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  };

  const handleRemoveDocumentType = async (
    stepId: string,
    documentTypeId: string
  ) => {
    try {
      await api.delete(
        `/api/admin/steps/${stepId}/document-types?document_type_id=${encodeURIComponent(documentTypeId)}`
      );
      await fetchStepConfig(stepId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-text-secondary">Chargement des steps...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          {steps.length} step{steps.length !== 1 ? "s" : ""} au total
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
        >
          + Créer une step
        </button>
      </div>

      <div className="bg-brand-card-bg border border-brand-stroke rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-stroke bg-brand-surface-light/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">
                Code
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">
                Libellé
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">
                Type
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">
                Position
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">
                Description
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-brand-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {steps
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((step) => (
                <React.Fragment key={step.id}>
                  <tr className="border-b border-brand-stroke hover:bg-brand-dark-bg/30">
                    <td className="px-4 py-3 text-brand-text-primary font-mono text-sm">
                      {step.code}
                    </td>
                    <td className="px-4 py-3 text-brand-text-primary">
                      {step.label}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          step.step_type === "ADMIN"
                            ? "bg-brand-warning/20 text-brand-warning"
                            : "bg-brand-accent/20 text-brand-accent"
                        }`}
                      >
                        {step.step_type === "ADMIN" ? "Admin" : "Client"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-text-secondary">
                      {step.position}
                    </td>
                    <td className="px-4 py-3 text-brand-text-secondary text-sm max-w-[200px] truncate">
                      {step.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingStep(step)}
                          className="text-brand-accent hover:underline text-sm"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpand(step.id)}
                          className="text-brand-text-secondary hover:text-brand-text-primary text-sm"
                        >
                          Configurer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(step)}
                          className="text-red-400 hover:underline text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedStepId === step.id && (
                    <tr key={`${step.id}-config`}>
                      <td
                        colSpan={6}
                        className="px-4 py-4 bg-brand-surface-light/30 border-b border-brand-stroke"
                      >
                        {loadingConfig[step.id] ? (
                          <div className="text-brand-text-secondary text-sm">
                            Chargement...
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-medium text-brand-text-primary mb-2">
                                Champs
                              </h4>
                              <ul className="space-y-1 text-sm text-brand-text-secondary">
                                {(stepFields[step.id] ?? []).length === 0 ? (
                                  <li>Aucun champ</li>
                                ) : (
                                  (stepFields[step.id] ?? []).map((f) => (
                                    <li key={f.id}>
                                      {f.field_key} — {f.label} ({f.field_type})
                                    </li>
                                  ))
                                )}
                              </ul>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowFieldModal({ stepId: step.id })
                                }
                                className="mt-2 text-sm text-brand-accent hover:underline"
                              >
                                + Ajouter un champ
                              </button>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-brand-text-primary mb-2">
                                Types de documents
                              </h4>
                              <ul className="space-y-1 text-sm text-brand-text-secondary">
                                {(stepDocTypes[step.id] ?? []).length === 0 ? (
                                  <li>Aucun type de document</li>
                                ) : (
                                  (stepDocTypes[step.id] ?? []).map((row) => (
                                    <li
                                      key={row.id}
                                      className="flex items-center justify-between gap-2"
                                    >
                                      <span>
                                        {row.document_type?.label ??
                                          row.document_type_id}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveDocumentType(
                                            step.id,
                                            row.document_type_id
                                          )
                                        }
                                        className="text-red-400 hover:underline text-xs"
                                      >
                                        Retirer
                                      </button>
                                    </li>
                                  ))
                                )}
                              </ul>
                              {addingDocTypeStepId === step.id ? (
                                <div className="mt-2 flex gap-2 items-center">
                                  <select
                                    className="flex-1 px-2 py-1 bg-brand-dark-bg border border-brand-border rounded text-sm text-brand-text-primary"
                                    onChange={(e) => {
                                      const id = e.target.value;
                                      if (id) {
                                        handleAddDocumentType(step.id, id);
                                      }
                                    }}
                                  >
                                    <option value="">
                                      Sélectionner un type...
                                    </option>
                                    {documentTypes
                                      .filter(
                                        (dt) =>
                                          !(stepDocTypes[step.id] ?? []).some(
                                            (r) => r.document_type_id === dt.id
                                          )
                                      )
                                      .map((dt) => (
                                        <option key={dt.id} value={dt.id}>
                                          {dt.label}
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => setAddingDocTypeStepId(null)}
                                    className="text-sm text-brand-text-secondary"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAddingDocTypeStepId(step.id)
                                  }
                                  className="mt-2 text-sm text-brand-accent hover:underline"
                                >
                                  + Ajouter un type de document
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateStepModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {editingStep && (
        <EditStepModal
          step={editingStep}
          onClose={() => setEditingStep(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showFieldModal && (
        <CustomFieldModal
          stepId={showFieldModal.stepId}
          field={showFieldModal.field}
          onSave={() => {
            handleFieldSaved();
          }}
          onClose={() => setShowFieldModal(null)}
        />
      )}
    </div>
  );
}
