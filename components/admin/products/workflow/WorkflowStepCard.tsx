"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WorkflowStepConfig } from "./WorkflowConfigContent";
import { DocumentTypesSelector } from "./DocumentTypesSelector";
import { CustomFieldsManager } from "./CustomFieldsManager";
import {
  DOSSIER_STATUS_OPTIONS,
  type DossierStatus,
} from "@/lib/dossier-status";

interface WorkflowStepCardProps {
  step: WorkflowStepConfig;
  index: number;
  onRemove: () => void;
  onUpdate: (step: WorkflowStepConfig) => void;
}

export function WorkflowStepCard({
  step,
  index,
  onRemove,
  onUpdate,
}: WorkflowStepCardProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-brand-card border border-brand-border rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-brand-dark-bg/30">
        <div className="flex items-center gap-4 flex-1">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-brand-text-secondary hover:text-brand-text-primary"
          >
            <span className="text-xl">⋮⋮</span>
          </button>

          {/* Step Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-brand-accent/20 text-brand-accent rounded text-sm font-medium">
                Step {index + 1}
              </span>
              <h3 className="text-lg font-semibold text-brand-text-primary">
                {step.step.label}
              </h3>
              {step.step.step_type === "ADMIN" && (
                <span className="px-2 py-1 bg-brand-warning/20 text-brand-warning rounded text-xs font-medium">
                  Admin
                </span>
              )}
              {step.step.step_type === "FORMATION" && (
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                  Formation
                </span>
              )}
              {step.step.step_type === "TIMER" && (
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                  Timer
                </span>
              )}
            </div>
            {step.step.description && (
              <p className="text-sm text-brand-text-secondary mt-1">
                {step.step.description}
              </p>
            )}
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-brand-text-secondary hover:text-brand-text-primary transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </button>

          {/* Remove Button */}
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 font-medium"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-6 space-y-6 border-t border-brand-border">
          {/* Formation (step_type FORMATION) — configurée au niveau de l'étape (steps) */}
          {step.step?.step_type === "FORMATION" && (
            <div>
              <h4 className="text-sm font-semibold text-brand-text-primary mb-3">
                Formation à suivre
              </h4>
              <p className="text-sm text-brand-text-primary">
                {step.step.formation?.titre ?? (
                  <span className="text-brand-text-secondary">
                    Aucune formation associée
                  </span>
                )}
              </p>
              <p className="text-xs text-brand-text-secondary mt-1">
                Configuré au niveau de l&apos;étape (onglet Étapes du produit).
              </p>
            </div>
          )}

          {/* Timer (step_type TIMER) — configuré au niveau de l'étape (steps) */}
          {step.step?.step_type === "TIMER" && (
            <div>
              <h4 className="text-sm font-semibold text-brand-text-primary mb-3">
                Délai (minutes)
              </h4>
              <p className="text-sm text-brand-text-primary">
                {step.step.timer_delay_minutes != null &&
                step.step.timer_delay_minutes > 0 ? (
                  `${step.step.timer_delay_minutes} min`
                ) : (
                  <span className="text-brand-text-secondary">
                    Non configuré
                  </span>
                )}
              </p>
              <p className="text-xs text-brand-text-secondary mt-1">
                Configuré au niveau de l&apos;étape (onglet Étapes du produit).
              </p>
            </div>
          )}

          {/* Document Types Section (hidden for FORMATION) */}
          {step.step?.step_type !== "FORMATION" && (
            <div>
              <h4 className="text-sm font-semibold text-brand-text-primary mb-3">
                Required Documents
              </h4>
              <DocumentTypesSelector
                selectedDocumentTypes={step.document_types}
                onUpdate={(documentTypes) =>
                  onUpdate({ ...step, document_types: documentTypes })
                }
              />
            </div>
          )}

          {/* Custom Fields Section (hidden for FORMATION) */}
          {step.step?.step_type !== "FORMATION" && (
            <div>
              <h4 className="text-sm font-semibold text-brand-text-primary mb-3">
                Custom Form Fields
              </h4>
              <CustomFieldsManager
                stepId={step.step_id}
                customFields={step.custom_fields as []}
                onUpdate={(customFields) =>
                  onUpdate({ ...step, custom_fields: customFields })
                }
              />
            </div>
          )}

          {/* Dossier status on approval */}
          <div>
            <h4 className="text-sm font-semibold text-brand-text-primary mb-3">
              Statut du dossier à la validation
            </h4>
            <select
              value={step.dossier_status_on_approval ?? ""}
              onChange={(e) =>
                onUpdate({
                  ...step,
                  dossier_status_on_approval:
                    (e.target.value as DossierStatus | "") || null,
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-brand-card border border-brand-border text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            >
              <option value="">Aucun</option>
              {DOSSIER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-brand-text-secondary mt-1">
              Si défini, le dossier passera à ce statut lors de
              l&apos;approbation de cette étape.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
