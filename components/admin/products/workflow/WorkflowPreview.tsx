"use client";

import { WorkflowStepConfig } from "./WorkflowConfigContent";
import { FieldType } from "@/types/products";

interface WorkflowPreviewProps {
  steps: WorkflowStepConfig[];
  onClose: () => void;
}

export function WorkflowPreview({ steps, onClose }: WorkflowPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-card">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Workflow Preview (Client View)
          </h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="bg-brand-dark-bg border border-brand-border rounded-lg p-6"
              >
                {/* Step Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-brand-text-primary">
                      {step.step.label}
                    </h3>
                    {step.step.description && (
                      <p className="text-sm text-brand-text-secondary mt-0.5">
                        {step.step.description}
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-sm">
                    Pending
                  </span>
                </div>

                {/* Required Documents */}
                {step.document_types.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-brand-text-primary mb-2">
                      Required Documents
                    </h4>
                    <div className="space-y-2">
                      {step.document_types.map((docType) => (
                        <div
                          key={docType.id}
                          className="flex items-center justify-between p-3 bg-brand-card border border-brand-border rounded-lg"
                        >
                          <div>
                            <div className="text-sm font-medium text-brand-text-primary">
                              {docType.label}
                            </div>
                            {docType.description && (
                              <div className="text-xs text-brand-text-secondary mt-0.5">
                                {docType.description}
                              </div>
                            )}
                            <div className="text-xs text-brand-text-secondary mt-1">
                              Accepted: {docType.allowed_extensions.join(", ")} • Max:{" "}
                              {docType.max_file_size_mb}MB
                            </div>
                          </div>
                          <button className="px-3 py-1 bg-brand-accent text-white rounded text-sm">
                            Upload
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Fields */}
                {step.custom_fields && step.custom_fields.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-brand-text-primary mb-3">
                      Additional Information
                    </h4>
                    <div className="space-y-4">
                      {step.custom_fields.map((field: unknown) => (
                        <PreviewField key={(field as { id: string }).id} field={field} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

interface PreviewFieldProps {
  field: unknown;
}

function PreviewField({ field }: PreviewFieldProps) {
  const f = field as {
    id: string;
    label: string;
    description: string | null;
    placeholder: string | null;
    field_type: FieldType;
    is_required: boolean;
    options: { value: string; label: string }[];
    help_text: string | null;
  };

  const renderInput = () => {
    switch (f.field_type) {
      case "textarea":
        return (
          <textarea
            placeholder={f.placeholder || ""}
            className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            rows={4}
            disabled
          />
        );

      case "select":
        return (
          <select
            className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            disabled
          >
            <option>Select an option...</option>
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {f.options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-brand-text-primary"
              >
                <input type="radio" name={f.id} value={opt.value} disabled />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {f.options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-brand-text-primary"
              >
                <input type="checkbox" value={opt.value} disabled />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case "file":
        return (
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm"
              disabled
            >
              Choose File
            </button>
            <span className="text-sm text-brand-text-secondary">
              No file chosen
            </span>
          </div>
        );

      default:
        return (
          <input
            type={f.field_type}
            placeholder={f.placeholder || ""}
            className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            disabled
          />
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-brand-text-primary mb-1">
        {f.label}
        {f.is_required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {f.description && (
        <p className="text-xs text-brand-text-secondary mb-2">{f.description}</p>
      )}
      {renderInput()}
      {f.help_text && (
        <p className="text-xs text-brand-text-secondary mt-1">{f.help_text}</p>
      )}
    </div>
  );
}
