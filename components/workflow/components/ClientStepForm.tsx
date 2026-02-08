import { DynamicFormField } from "@/components/qualification/DynamicFormField";
import { StepDocuments } from "../StepDocuments";
import { ValidationErrorPanel } from "./ValidationErrorPanel";
import type { ClientStepFormProps } from "../types";

/**
 * ClientStepForm Component
 *
 * Form for CLIENT steps (editable by users).
 * Displays:
 * - Form fields with validation
 * - Required documents upload
 * - Validation error panel
 * - Submit and navigation buttons
 */
export function ClientStepForm({
  fields,
  formData,
  errors,
  touched,
  showValidationErrors,
  isSubmitting,
  currentStep,
  currentStepInstance,
  uploadedDocuments,
  dossierId,
  canEditField,
  onFieldChange,
  onFieldBlur,
  onDocumentUploaded,
  onDismissErrors,
  onSubmit,
  onNavigatePrevious,
  currentStepIndex,
  totalSteps,
  isNextStepBlockedByTimer,
}: ClientStepFormProps) {
  // Check if all required fields are filled
  const areRequiredFieldsFilled = () => {
    const requiredFields = fields.filter((field) => field.is_required);
    return requiredFields.every((field) => {
      const value = formData[field.field_key];
      // Check if value exists and is not empty
      if (value === undefined || value === null || value === "") {
        return false;
      }
      // For arrays (like checkboxes), check if not empty
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      return true;
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {fields.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-brand-text-secondary">
            Aucun champ à remplir pour cette étape.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {fields.map((field) => {
            // Group first_name and last_name together
            const isFirstName = field.field_key === "first_name";
            const isLastName = field.field_key === "last_name";
            const fieldCanEdit = canEditField(field);

            if (isFirstName) {
              const lastNameField = fields.find(
                (f) =>
                  f.field_key === "last_name" &&
                  f.position === field.position + 1
              );

              if (lastNameField) {
                return (
                  <div
                    key={`pair-${field.id}`}
                    className="grid md:grid-cols-2 gap-6"
                  >
                    <DynamicFormField
                      field={field}
                      value={formData[field.field_key]}
                      error={
                        touched[field.field_key]
                          ? errors[field.field_key]
                          : undefined
                      }
                      onChange={(value) => onFieldChange(field.field_key, value)}
                      onBlur={() => onFieldBlur(field)}
                      validationStatus={field.validationStatus}
                      rejectionReason={field.rejectionReason || undefined}
                      disabled={!fieldCanEdit}
                    />
                    <DynamicFormField
                      field={lastNameField}
                      value={formData[lastNameField.field_key]}
                      error={
                        touched[lastNameField.field_key]
                          ? errors[lastNameField.field_key]
                          : undefined
                      }
                      onChange={(value) =>
                        onFieldChange(lastNameField.field_key, value)
                      }
                      onBlur={() => onFieldBlur(lastNameField)}
                      validationStatus={lastNameField.validationStatus}
                      rejectionReason={
                        lastNameField.rejectionReason || undefined
                      }
                      disabled={!canEditField(lastNameField)}
                    />
                  </div>
                );
              }
            }

            if (isLastName) {
              const firstNameField = fields.find(
                (f) =>
                  f.field_key === "first_name" &&
                  f.position === field.position - 1
              );
              if (firstNameField) {
                return null;
              }
            }

            return (
              <DynamicFormField
                key={field.id}
                field={field}
                value={formData[field.field_key]}
                error={
                  touched[field.field_key]
                    ? errors[field.field_key]
                    : undefined
                }
                onChange={(value) => onFieldChange(field.field_key, value)}
                onBlur={() => onFieldBlur(field)}
                validationStatus={field.validationStatus}
                rejectionReason={field.rejectionReason || undefined}
                disabled={!fieldCanEdit}
              />
            );
          })}
        </div>
      )}

      {/* Required Documents Section (only for client steps) */}
      {currentStep.document_types &&
        currentStep.document_types.length > 0 &&
        currentStepInstance && (
          <div className="border-t border-brand-dark-border pt-6 mt-6">
            <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
              Documents requis
            </h3>
            <StepDocuments
              dossierId={dossierId}
              stepInstanceId={currentStepInstance.id}
              requiredDocuments={currentStep.document_types}
              uploadedDocuments={uploadedDocuments}
              onDocumentUploaded={onDocumentUploaded}
            />
          </div>
        )}

      {/* Validation Errors Section */}
      <ValidationErrorPanel
        errors={errors}
        fields={fields}
        isVisible={showValidationErrors}
        onDismiss={onDismissErrors}
      />

      {/* Submit Button */}
      <div className="pt-6 border-t border-brand-dark-border flex items-center justify-between">
        {currentStepIndex > 0 && (
          <button
            type="button"
            onClick={onNavigatePrevious}
            className="px-6 py-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            Étape précédente
          </button>
        )}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            fields.length === 0 ||
            isNextStepBlockedByTimer ||
            !areRequiredFieldsFilled()
          }
          className="ml-auto px-8 py-3.5 rounded-xl font-semibold text-base
            bg-brand-accent text-brand-dark-bg
            transition-all duration-300
            disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-brand-dark-border disabled:text-brand-text-secondary
            enabled:hover:opacity-90 enabled:hover:translate-y-[-2px] enabled:hover:shadow-[0_6px_20px_rgba(0,240,255,0.3)]
            focus:outline-none focus:ring-2 focus:ring-brand-accent/50
            flex items-center justify-center gap-2"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Soumission en cours...</span>
            </>
          ) : currentStepInstance?.validation_status === "REJECTED" ? (
            <>
              <i className="fas fa-check-circle mr-2"></i>
              Soumettre les corrections
            </>
          ) : currentStepIndex === totalSteps - 1 ? (
            <>
              <i className="fas fa-flag-checkered mr-2"></i>
              Terminer le processus
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane mr-2"></i>
              Soumettre cette étape
            </>
          )}
        </button>
      </div>
    </form>
  );
}
