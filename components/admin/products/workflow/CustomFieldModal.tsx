"use client";

import { useState } from "react";
import { StepField, FieldType } from "@/types/products";
import { useApi } from "@/lib/api/useApi";

interface CustomFieldModalProps {
  stepId: string;
  field?: StepField;
  onSave: (field: StepField) => void;
  onClose: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select (Dropdown)" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
];

export function CustomFieldModal({
  stepId,
  field,
  onSave,
  onClose,
}: CustomFieldModalProps) {
  const api = useApi();
  const [formData, setFormData] = useState<
    Omit<StepField, "id" | "created_at" | "updated_at">
  >({
    step_id: stepId,
    field_key: field?.field_key || "",
    label: field?.label || "",
    description: field?.description || null,
    placeholder: field?.placeholder || null,
    field_type: field?.field_type || "text",
    is_required: field?.is_required || false,
    min_length: field?.min_length || null,
    max_length: field?.max_length || null,
    min_value: field?.min_value || null,
    max_value: field?.max_value || null,
    pattern: field?.pattern || null,
    options: field?.options || [],
    help_text: field?.help_text || null,
    default_value: field?.default_value || null,
    position: field?.position || 0,
  });

  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFieldKey = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  const handleLabelChange = (label: string) => {
    setFormData({
      ...formData,
      label,
      field_key: field ? formData.field_key : generateFieldKey(label),
    });
  };

  const handleAddOption = () => {
    if (!newOptionValue || !newOptionLabel) return;

    const newOption = {
      value: newOptionValue,
      label: newOptionLabel,
    };

    setFormData({
      ...formData,
      options: [...formData.options, newOption],
    });

    setNewOptionValue("");
    setNewOptionLabel("");
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.label.length < 2 || formData.label.length > 100) {
      setError("Label must be between 2 and 100 characters");
      return;
    }

    if (
      ["select", "radio", "checkbox"].includes(formData.field_type) &&
      formData.options.length < 2
    ) {
      setError("Select, Radio, and Checkbox fields require at least 2 options");
      return;
    }

    setLoading(true);

    try {
      const url = `/api/admin/steps/${stepId}/fields`;
      const method = field ? "PUT" : "POST";
      
      // For creation, exclude position to let API calculate it automatically
      // For update, include position to allow reordering
      const { position: _, ...formDataWithoutPosition } = formData;
      const body = field
        ? {
            id: field.id,
            ...formData,
          }
        : formDataWithoutPosition;

      const data = await (method === "PUT"
        ? api.put<{ field: StepField }>(url, body)
        : api.post<{ field: StepField }>(url, body));
      onSave(data.field);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const needsTextValidation = ["text", "textarea", "email", "phone"].includes(
    formData.field_type
  );
  const needsNumberValidation = ["number"].includes(formData.field_type);
  const needsOptions = ["select", "radio", "checkbox"].includes(
    formData.field_type
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-card">
          <h3 className="text-lg font-semibold text-brand-text-primary">
            {field ? "Edit" : "Add"} Custom Field
          </h3>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-1">
                Field Label <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="e.g., Company Name"
              />
            </div>

            {/* Field Key */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-1">
                Field Key (auto-generated)
              </label>
              <input
                type="text"
                value={formData.field_key}
                readOnly
                className="w-full px-3 py-2 bg-brand-dark-bg/50 border border-brand-border rounded-lg text-brand-text-secondary font-mono text-sm"
              />
            </div>
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Field Type <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.field_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  field_type: e.target.value as FieldType,
                })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description / Help Text */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Description / Help Text
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value || null })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              rows={2}
              placeholder="Help text shown to users"
            />
          </div>

          {/* Placeholder */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={formData.placeholder || ""}
              onChange={(e) =>
                setFormData({ ...formData, placeholder: e.target.value || null })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="e.g., Enter your company name"
            />
          </div>

          {/* Required Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={formData.is_required}
              onChange={(e) =>
                setFormData({ ...formData, is_required: e.target.checked })
              }
              className="w-4 h-4 rounded border-brand-border"
            />
            <label htmlFor="required" className="text-sm text-brand-text-primary">
              Required field
            </label>
          </div>

          {/* Text Validation */}
          {needsTextValidation && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">
                  Min Length
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_length || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_length: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">
                  Max Length
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.max_length || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_length: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>
            </div>
          )}

          {/* Number Validation */}
          {needsNumberValidation && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">
                  Min Value
                </label>
                <input
                  type="number"
                  value={formData.min_value || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_value: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1">
                  Max Value
                </label>
                <input
                  type="number"
                  value={formData.max_value || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_value: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>
            </div>
          )}

          {/* Regex Pattern */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Validation Pattern (Regex)
            </label>
            <input
              type="text"
              value={formData.pattern || ""}
              onChange={(e) =>
                setFormData({ ...formData, pattern: e.target.value || null })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent font-mono text-sm"
              placeholder="e.g., ^[A-Z]{2}[0-9]{4}$"
            />
          </div>

          {/* Options for Select/Radio/Checkbox */}
          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Options <span className="text-red-400">*</span> (min 2)
              </label>

              {/* Existing Options */}
              {formData.options.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formData.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-brand-dark-bg/30 rounded"
                    >
                      <span className="flex-1 text-sm text-brand-text-primary">
                        <span className="font-mono text-brand-accent">
                          {option.value}
                        </span>{" "}
                        - {option.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Option */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  placeholder="Value (e.g., llc)"
                  className="flex-1 px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                />
                <input
                  type="text"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  placeholder="Label (e.g., LLC)"
                  className="flex-1 px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-2 bg-brand-accent/20 text-brand-accent rounded-lg hover:bg-brand-accent/30 text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Default Value */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Default Value
            </label>
            <input
              type="text"
              value={formData.default_value || ""}
              onChange={(e) =>
                setFormData({ ...formData, default_value: e.target.value || null })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving..."
                : field
                  ? "Update"
                  : "Add"}{" "}
              Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
