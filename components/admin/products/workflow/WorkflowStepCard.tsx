"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WorkflowStepConfig } from "./WorkflowConfigContent";
import { DocumentTypesSelector } from "./DocumentTypesSelector";
import { CustomFieldsManager } from "./CustomFieldsManager";

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
          {/* Document Types Section */}
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

          {/* Custom Fields Section */}
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
        </div>
      )}
    </div>
  );
}
