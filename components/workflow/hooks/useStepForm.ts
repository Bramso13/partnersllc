import { useReducer, useCallback } from "react";
import { useApi } from "@/lib/api/useApi";
import { validateForm } from "@/lib/validation";
import type { UseStepFormReturn, FormState, FormAction, StepFieldWithValidation } from "../types";
import type { StepField } from "@/types/qualification";
import type { StepInstance } from "@/types/dossiers";

/**
 * Form reducer to manage form state transitions.
 * Handles field changes, validation, errors, and submission state.
 */
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "FIELD_CHANGE":
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.fieldKey]: action.payload.value,
        },
        // Clear error for this field when user changes it
        errors: {
          ...state.errors,
          [action.payload.fieldKey]: undefined,
        } as Record<string, string>,
      };

    case "FIELD_BLUR":
      return {
        ...state,
        touched: {
          ...state.touched,
          [action.payload.fieldKey]: true,
        },
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.payload,
      };

    case "CLEAR_ERROR":
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        errors: newErrors,
        // Hide validation errors section if no errors remain
        showValidationErrors: Object.keys(newErrors).length > 0,
      };

    case "SHOW_VALIDATION_ERRORS":
      return {
        ...state,
        showValidationErrors: action.payload,
      };

    case "SET_SUBMITTING":
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case "RESET_FORM":
      return {
        formData: action.payload,
        errors: {},
        touched: {},
        showValidationErrors: false,
        isSubmitting: false,
      };

    case "SET_ALL_TOUCHED":
      const allTouched: Record<string, boolean> = {};
      Object.keys(state.formData).forEach((key) => {
        allTouched[key] = true;
      });
      return {
        ...state,
        touched: allTouched,
      };

    default:
      return state;
  }
}

/**
 * Custom hook to manage workflow step form state and validation.
 *
 * Uses useReducer for better state management with complex form logic.
 * Handles:
 * - Form data state
 * - Validation and error display
 * - Field editing permissions
 * - Submit and resubmit logic (for REJECTED steps)
 *
 * @param fields - Step fields with validation rules
 * @param currentStepInstance - Current step instance with validation status
 * @param onStepComplete - Callback when step is submitted successfully
 * @param onNavigateNext - Callback to navigate to next step
 * @returns Form state and handlers
 *
 * @example
 * const form = useStepForm({
 *   fields: stepData.currentStepFields,
 *   currentStepInstance: stepData.currentStepInstance,
 *   onStepComplete,
 *   onNavigateNext: navigation.goToNextStep
 * });
 */
export function useStepForm({
  stepId,
  fields,
  currentStepInstance,
  onStepComplete,
  onNavigateNext,
  initialFormData = {},
}: {
  stepId: string;
  fields: StepFieldWithValidation[];
  currentStepInstance: StepInstance | null;
  onStepComplete: (stepId: string, fieldValues: Record<string, any>) => Promise<void>;
  onNavigateNext: () => void;
  initialFormData?: Record<string, any>;
}): UseStepFormReturn {
  const api = useApi();
  const [state, dispatch] = useReducer(formReducer, {
    formData: initialFormData,
    errors: {},
    touched: {},
    showValidationErrors: false,
    isSubmitting: false,
  });

  const handleFieldChange = useCallback((fieldKey: string, value: any) => {
    dispatch({ type: "FIELD_CHANGE", payload: { fieldKey, value } });
  }, []);

  const handleFieldBlur = useCallback((field: StepField) => {
    dispatch({ type: "FIELD_BLUR", payload: { fieldKey: field.field_key } });
  }, []);

  const setShowValidationErrors = useCallback((show: boolean) => {
    dispatch({ type: "SHOW_VALIDATION_ERRORS", payload: show });
  }, []);

  const resetForm = useCallback((newFormData: Record<string, any>) => {
    dispatch({ type: "RESET_FORM", payload: newFormData });
  }, []);

  const setIsSubmitting = useCallback((submitting: boolean) => {
    dispatch({ type: "SET_SUBMITTING", payload: submitting });
  }, []);

  /**
   * Determine if a field can be edited based on validation status.
   * - DRAFT: All fields editable
   * - REJECTED: All fields editable (user must correct)
   * - SUBMITTED/UNDER_REVIEW/APPROVED: No fields editable
   */
  const canEditField = useCallback(
    (field: StepFieldWithValidation) => {
      const status = currentStepInstance?.validation_status;
      if (!status || status === "DRAFT") return true;
      if (status === "REJECTED") return true;
      // SUBMITTED, UNDER_REVIEW, and APPROVED: no editing
      return false;
    },
    [currentStepInstance]
  );

  /**
   * Handle form submission.
   *
   * Workflow:
   * 1. Client submits → validation_status = "SUBMITTED", completed_at = NOW (step completed)
   * 2. Admin reviews → validation_status = "UNDER_REVIEW", completed_at unchanged
   * 3. Admin approves → validation_status = "APPROVED", completed_at unchanged
   * 4. Admin rejects → validation_status = "REJECTED", user can edit again
   * 5. Client resubmits → validation_status = "SUBMITTED", completed_at = NOW (updated)
   *
   * completed_at = when user finished/submitted the step (used for navigation and TIMER)
   * validation_status = admin approval status (used for edit permissions and display)
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate step ID
      if (!stepId) {
        console.error("[useStepForm] No step ID available");
        return;
      }

      // Mark all fields as touched
      dispatch({ type: "SET_ALL_TOUCHED" });

      // If this is a resubmit (REJECTED status), only validate rejected fields
      const isResubmit = currentStepInstance?.validation_status === "REJECTED";

      if (isResubmit) {
        // Only validate rejected fields that are being corrected
        const rejectedFields = fields.filter(
          (f) => f.validationStatus === "REJECTED"
        );
        const rejectedFieldValues: Record<string, any> = {};
        rejectedFields.forEach((field) => {
          rejectedFieldValues[field.field_key] = state.formData[field.field_key];
        });

        const validationErrors = validateForm(
          rejectedFieldValues,
          rejectedFields
        );
        if (Object.keys(validationErrors).length > 0) {
          dispatch({ type: "SET_ERRORS", payload: validationErrors });
          dispatch({ type: "SHOW_VALIDATION_ERRORS", payload: true });
          const firstErrorField = Object.keys(validationErrors)[0];
          const element = document.getElementById(
            `field-${rejectedFields.find((f) => f.field_key === firstErrorField)?.id}`
          );
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }

        // Resubmit only corrected rejected fields
        dispatch({ type: "SET_SUBMITTING", payload: true });
        dispatch({ type: "SHOW_VALIDATION_ERRORS", payload: false });
        try {
          if (!currentStepInstance?.id) {
            throw new Error("Instance d'étape introuvable");
          }

          await api.patch("/api/workflow/resubmit-step", {
            step_instance_id: currentStepInstance.id,
            corrected_fields: rejectedFieldValues,
          });

          // Navigate to next step after successful resubmission
          onNavigateNext();
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "Erreur lors de la resoumission"
          );
        } finally {
          dispatch({ type: "SET_SUBMITTING", payload: false });
        }
      } else {
        // Normal submit - validate all fields
        const validationErrors = validateForm(state.formData, fields);
        if (Object.keys(validationErrors).length > 0) {
          dispatch({ type: "SET_ERRORS", payload: validationErrors });
          dispatch({ type: "SHOW_VALIDATION_ERRORS", payload: true });
          const firstErrorField = Object.keys(validationErrors)[0];
          const element = document.getElementById(
            `field-${fields.find((f) => f.field_key === firstErrorField)?.id}`
          );
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }

        dispatch({ type: "SET_SUBMITTING", payload: true });
        dispatch({ type: "SHOW_VALIDATION_ERRORS", payload: false });
        try {
          await onStepComplete(stepId, state.formData);

          // Navigate to next step after successful submission
          onNavigateNext();
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "Erreur lors de la soumission"
          );
        } finally {
          dispatch({ type: "SET_SUBMITTING", payload: false });
        }
      }
    },
    [
      stepId,
      currentStepInstance,
      fields,
      state.formData,
      onStepComplete,
      onNavigateNext,
      api,
    ]
  );

  return {
    formData: state.formData,
    errors: state.errors,
    touched: state.touched,
    showValidationErrors: state.showValidationErrors,
    isSubmitting: state.isSubmitting,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    setShowValidationErrors,
    setIsSubmitting,
    resetForm,
    canEditField,
  };
}
