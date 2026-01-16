"use client";

import { useState, useEffect } from "react";
import { Step } from "@/types/products";

interface AddStepModalProps {
  availableSteps: Step[];
  selectedStepIds: string[];
  onAdd: (stepId: string) => void;
  onClose: () => void;
  onRefreshSteps?: () => void;
}

type TabType = "select" | "create";

interface CreateStepFormData {
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

// Helper function to convert label to UPPER_SNAKE_CASE code
function labelToCode(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, "_") // Spaces to underscores
    .replace(/^_+|_+$/g, ""); // Trim underscores
}

// Validation regex for UPPER_SNAKE_CASE
const UPPER_SNAKE_CASE_REGEX = /^[A-Z][A-Z0-9_]*$/;

export function AddStepModal({
  availableSteps,
  selectedStepIds,
  onAdd,
  onClose,
  onRefreshSteps,
}: AddStepModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("select");
  const [selectedStep, setSelectedStep] = useState<string>("");

  // Create step form state
  const [formData, setFormData] = useState<CreateStepFormData>({
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

  // Filter out already selected steps
  const unselectedSteps = availableSteps.filter(
    (step) => !selectedStepIds.includes(step.id)
  );

  // Auto-generate code from label
  useEffect(() => {
    if (formData.label && !formData.code) {
      const generatedCode = labelToCode(formData.label);
      setFormData((prev) => ({ ...prev, code: generatedCode }));
    }
  }, [formData.label]);

  const handleSelectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStep) {
      onAdd(selectedStep);
    }
  };

  const validateCode = async (code: string): Promise<string | undefined> => {
    if (!code) {
      return "Code is required";
    }
    if (code.length < 3) {
      return "Code must be at least 3 characters";
    }
    if (code.length > 50) {
      return "Code must not exceed 50 characters";
    }
    if (!UPPER_SNAKE_CASE_REGEX.test(code)) {
      return "Code must be in UPPER_SNAKE_CASE format (e.g., MY_CUSTOM_STEP)";
    }

    // Check uniqueness
    setIsValidating(true);
    try {
      const response = await fetch(`/api/admin/steps/check-code?code=${encodeURIComponent(code)}`);
      const data = await response.json();
      if (data.exists) {
        return "This code already exists. Please choose a unique code.";
      }
    } catch (err) {
      console.error("Error validating code:", err);
    } finally {
      setIsValidating(false);
    }

    return undefined;
  };

  const validateLabel = (label: string): string | undefined => {
    if (!label) {
      return "Label is required";
    }
    if (label.length < 2) {
      return "Label must be at least 2 characters";
    }
    if (label.length > 100) {
      return "Label must not exceed 100 characters";
    }
    return undefined;
  };

  const validateDescription = (description: string): string | undefined => {
    if (description && description.length > 500) {
      return "Description must not exceed 500 characters";
    }
    return undefined;
  };

  const validatePosition = (position: string): string | undefined => {
    if (position && isNaN(parseInt(position))) {
      return "Position must be a number";
    }
    return undefined;
  };

  const handleCodeBlur = async () => {
    const error = await validateCode(formData.code);
    setErrors((prev) => ({ ...prev, code: error }));
  };

  const handleLabelBlur = () => {
    const error = validateLabel(formData.label);
    setErrors((prev) => ({ ...prev, label: error }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
    const error = validateDescription(value);
    setErrors((prev) => ({ ...prev, description: error }));
  };

  const handlePositionBlur = () => {
    const error = validatePosition(formData.position);
    setErrors((prev) => ({ ...prev, position: error }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all fields
    const codeError = await validateCode(formData.code);
    const labelError = validateLabel(formData.label);
    const descriptionError = validateDescription(formData.description);
    const positionError = validatePosition(formData.position);

    const newErrors: FormErrors = {
      code: codeError,
      label: labelError,
      description: descriptionError,
      position: positionError,
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error !== undefined)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: {
        code: string;
        label: string;
        description?: string;
        position?: number;
        step_type?: "CLIENT" | "ADMIN";
      } = {
        code: formData.code,
        label: formData.label,
        step_type: formData.step_type,
      };

      if (formData.description) {
        payload.description = formData.description;
      }

      if (formData.position) {
        payload.position = parseInt(formData.position);
      }

      const response = await fetch("/api/admin/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create step");
      }

      // Refresh available steps if callback provided
      if (onRefreshSteps) {
        await onRefreshSteps();
      }

      // Add the newly created step to the workflow
      onAdd(data.step.id);

      // Close modal
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    !errors.code &&
    !errors.label &&
    !errors.description &&
    !errors.position &&
    formData.code &&
    formData.label &&
    !isValidating;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-card z-10">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Add Workflow Step
          </h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-brand-border px-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("select")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "select"
                  ? "border-brand-accent text-brand-accent"
                  : "border-transparent text-brand-text-secondary hover:text-brand-text-primary"
              }`}
            >
              Select Existing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "create"
                  ? "border-brand-accent text-brand-accent"
                  : "border-transparent text-brand-text-secondary hover:text-brand-text-primary"
              }`}
            >
              Create New
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "select" ? (
            <form onSubmit={handleSelectSubmit} className="space-y-4">
              {unselectedSteps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-brand-text-secondary">
                    All available steps have been added to this workflow.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("create")}
                    className="mt-4 px-4 py-2 bg-brand-accent/20 text-brand-accent rounded-lg hover:bg-brand-accent/30 transition-colors font-medium"
                  >
                    Create New Step Instead
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-primary mb-2">
                      Select a step to add
                    </label>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {unselectedSteps.map((step) => (
                        <label
                          key={step.id}
                          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedStep === step.id
                              ? "border-brand-accent bg-brand-accent/10"
                              : "border-brand-border hover:border-brand-accent/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="step"
                            value={step.id}
                            checked={selectedStep === step.id}
                            onChange={(e) => setSelectedStep(e.target.value)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-brand-text-primary">
                                {step.label}
                              </div>
                              {step.step_type === "ADMIN" && (
                                <span className="px-2 py-0.5 bg-brand-warning/20 text-brand-warning rounded text-xs font-medium">
                                  Admin
                                </span>
                              )}
                            </div>
                            {step.description && (
                              <div className="text-sm text-brand-text-secondary mt-1">
                                {step.description}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
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
                      disabled={!selectedStep}
                      className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 font-medium"
                    >
                      Add Step
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {submitError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              {/* Code Field */}
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  onBlur={handleCodeBlur}
                  placeholder="MY_CUSTOM_STEP"
                  className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                    errors.code ? "border-red-500" : "border-brand-border"
                  }`}
                />
                <p className="text-xs text-brand-text-secondary mt-1">
                  Format: UPPER_SNAKE_CASE (auto-generated from label)
                </p>
                {errors.code && (
                  <p className="text-xs text-red-400 mt-1">{errors.code}</p>
                )}
                {isValidating && (
                  <p className="text-xs text-brand-accent mt-1">Checking availability...</p>
                )}
              </div>

              {/* Label Field */}
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Label <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, label: e.target.value }))
                  }
                  onBlur={handleLabelBlur}
                  placeholder="My Custom Step"
                  className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                    errors.label ? "border-red-500" : "border-brand-border"
                  }`}
                />
                {errors.label && (
                  <p className="text-xs text-red-400 mt-1">{errors.label}</p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Describe this workflow step..."
                  rows={3}
                  maxLength={500}
                  className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none ${
                    errors.description ? "border-red-500" : "border-brand-border"
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-brand-text-secondary">
                    {formData.description.length}/500 characters
                  </p>
                  {errors.description && (
                    <p className="text-xs text-red-400">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Step Type Field */}
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Step Type <span className="text-red-400">*</span>
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
                  <option value="CLIENT">Client Step (default)</option>
                  <option value="ADMIN">Admin Step</option>
                </select>
                <p className="text-xs text-brand-text-secondary mt-1">
                  Admin steps are managed by administrators and can receive documents from admins
                </p>
              </div>

              {/* Position Field */}
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Position (optional)
                </label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, position: e.target.value }))
                  }
                  onBlur={handlePositionBlur}
                  placeholder="Auto-calculated if empty"
                  className={`w-full px-3 py-2 bg-brand-dark-bg border rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                    errors.position ? "border-red-500" : "border-brand-border"
                  }`}
                />
                <p className="text-xs text-brand-text-secondary mt-1">
                  Leave empty for automatic positioning
                </p>
                {errors.position && (
                  <p className="text-xs text-red-400 mt-1">{errors.position}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {isSubmitting ? "Creating..." : "Create Step"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
