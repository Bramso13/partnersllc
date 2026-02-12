"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useDocumentPreview } from "./hooks/useDocumentPreview";
import { useStepNavigation } from "./hooks/useStepNavigation";
import { useStepData } from "./hooks/useStepData";
import { useStepForm } from "./hooks/useStepForm";
import { DocumentPreviewModal } from "./components/DocumentPreviewModal";
import { StepProgressBar } from "./components/StepProgressBar";
import { TimerBlockMessage } from "./components/TimerBlockMessage";
import { StepStatusMessage } from "./components/StepStatusMessage";
import { FormationRecommendations } from "./components/FormationRecommendations";
import { AdminStepView } from "./components/AdminStepView";
import { FormationStepView } from "./components/FormationStepView";
import { ClientStepForm } from "./components/ClientStepForm";
import { ClientStepReadOnly } from "./components/ClientStepReadOnly";
import type {
  WorkflowStepperProps,
  StepFieldWithValidation,
} from "./types";

export function WorkflowStepper({
  productSteps,
  dossierId,
  userId,
  onStepComplete,
  initialStepId,
  stepInstances = [],
}: WorkflowStepperProps) {
  // Use navigation hook
  const navigation = useStepNavigation({
    productSteps,
    stepInstances,
    initialStepId,
  });

  const currentStep = productSteps[navigation.currentStepIndex];
  const totalSteps = productSteps.length;

  // Check if current step is an admin step or formation step
  const isAdminStep = currentStep?.step?.step_type === "ADMIN";
  const isFormationStep = currentStep?.step?.step_type === "FORMATION";

  // Use step data hook
  const stepData = useStepData({
    dossierId,
    stepId: currentStep?.step_id,
    stepType: currentStep?.step?.step_type,
    isAdminStep,
    isFormationStep,
    formationId: currentStep?.formation_id,
  });

  // Use form hook
  const form = useStepForm({
    stepId: currentStep?.step_id || "",
    fields: stepData.currentStepFields,
    currentStepInstance: stepData.currentStepInstance,
    onStepComplete,
    onNavigateNext: navigation.goToNextStep,
    initialFormData: {},
  });

  // Use document preview hook
  const preview = useDocumentPreview(dossierId);

  console.log(
    "[WORKFLOW STEPPER] Current step document types:",
    currentStep?.document_types
  );

  // Initialize/reset form data when step fields change
  useEffect(() => {
    if (!isAdminStep && !isFormationStep && stepData.currentStepFields.length > 0) {
      const initialData: Record<string, any> = {};
      stepData.currentStepFields.forEach((field: StepFieldWithValidation) => {
        if (
          field.currentValue !== undefined &&
          field.currentValue !== null
        ) {
          // Parse JSONB arrays if needed
          if (
            typeof field.currentValue === "string" &&
            field.field_type === "checkbox"
          ) {
            try {
              initialData[field.field_key] = JSON.parse(field.currentValue);
            } catch {
              initialData[field.field_key] = field.currentValue;
            }
          } else {
            initialData[field.field_key] = field.currentValue;
          }
        } else if (field.default_value) {
          initialData[field.field_key] = field.default_value;
        } else if (
          field.field_type === "checkbox" &&
          Array.isArray(field.options)
        ) {
          initialData[field.field_key] = [];
        }
      });
      form.resetForm(initialData);
    } else {
      form.resetForm({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepData.currentStepFields, isAdminStep, isFormationStep]);

  // Determine if user can edit based on step type and validation status
  const canEdit = () => {
    // Admin steps are never editable by client
    if (isAdminStep) return false;

    // Client steps: allow editing only for DRAFT and REJECTED
    if (!stepData.currentStepInstance) return true;
    return (
      stepData.currentStepInstance.validation_status === "DRAFT" ||
      stepData.currentStepInstance.validation_status === "REJECTED"
    );
  };

  const isEditable = canEdit();

  if (stepData.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <StepProgressBar
        currentStepIndex={navigation.currentStepIndex}
        totalSteps={totalSteps}
        currentStepLabel={currentStep.step.label}
        currentStepDescription={currentStep.step.description ?? undefined}
        isAdminStep={isAdminStep}
        productSteps={productSteps}
        getNextStepAvailableAt={navigation.getNextStepAvailableAt}
      />

      {/* TIMER: message when next step is blocked by delay */}
      <TimerBlockMessage
        isBlocked={navigation.isNextStepBlockedByTimer}
        remainingMinutes={navigation.timerRemainingMinutes}
      />

      {/* Step Status Message */}
      <StepStatusMessage
        validationStatus={stepData.currentStepInstance?.validation_status}
        isAdminStep={isAdminStep}
      />

      {/* Formations recommandées (Story 12.4 + 12.5 parcours + custom) */}
      <FormationRecommendations
        formations={stepData.stepFormations}
        stepFormationItems={stepData.stepFormationItems}
        isFormationStep={isFormationStep}
      />

      {/* Admin Step View */}
      {isAdminStep && (
        <AdminStepView
          currentStepInstance={stepData.currentStepInstance}
          uploadedDocuments={stepData.uploadedDocuments}
          dossierId={dossierId}
          onViewDocument={preview.handleViewDocument}
          onNavigateNext={() => {
            if (navigation.currentStepIndex < totalSteps - 1) {
              navigation.goToNextStep();
              navigation.resetLoadedStep();
            } else {
              window.location.href = "/dashboard";
            }
          }}
          onNavigatePrevious={() => {
            navigation.goToPreviousStep();
            navigation.resetLoadedStep();
          }}
          currentStepIndex={navigation.currentStepIndex}
          totalSteps={totalSteps}
          isNextStepBlockedByTimer={navigation.isNextStepBlockedByTimer}
        />
      )}

      {/* Formation Step: Display formation + button to complete */}
      {isFormationStep && (
        <>
          <FormationStepView
            currentStep={currentStep}
            formationFull={stepData.formationFull}
            formationProgress={stepData.formationProgress}
            formationLoading={stepData.formationLoading}
            userId={userId ?? ""}
            isSubmitting={form.isSubmitting}
            onCompleteFormationStep={async () => {
              form.setIsSubmitting(true);
              try {
                await onStepComplete(currentStep.step_id, {});
                if (navigation.currentStepIndex < totalSteps - 1) {
                  navigation.goToNextStep();
                  navigation.resetLoadedStep();
                } else {
                  window.location.href = "/dashboard";
                }
              } catch (err) {
                console.error("Error completing formation step:", err);
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Erreur lors du passage à l'étape suivante"
                );
              } finally {
                form.setIsSubmitting(false);
              }
            }}
            onNavigateNext={() => {
              if (navigation.currentStepIndex < totalSteps - 1) {
                navigation.goToNextStep();
                navigation.resetLoadedStep();
              } else {
                window.location.href = "/dashboard";
              }
            }}
            onNavigatePrevious={() => {
              navigation.goToPreviousStep();
              navigation.resetLoadedStep();
            }}
            currentStepIndex={navigation.currentStepIndex}
            totalSteps={totalSteps}
          />
        </>
      )}

      {/* Client Step Form (editable: DRAFT or REJECTED) */}
      {!isAdminStep && !isFormationStep && isEditable && (
        <ClientStepForm
          fields={stepData.currentStepFields}
          formData={form.formData}
          errors={form.errors}
          touched={form.touched}
          showValidationErrors={form.showValidationErrors}
          isSubmitting={form.isSubmitting}
          currentStep={currentStep}
          currentStepInstance={stepData.currentStepInstance}
          uploadedDocuments={stepData.uploadedDocuments}
          dossierId={dossierId}
          canEditField={form.canEditField}
          onFieldChange={form.handleFieldChange}
          onFieldBlur={form.handleFieldBlur}
          onDocumentUploaded={stepData.reloadDocuments}
          onDismissErrors={() => form.setShowValidationErrors(false)}
          onSubmit={form.handleSubmit}
          onNavigatePrevious={() => {
            navigation.goToPreviousStep();
            navigation.resetLoadedStep();
          }}
          currentStepIndex={navigation.currentStepIndex}
          totalSteps={totalSteps}
          isNextStepBlockedByTimer={navigation.isNextStepBlockedByTimer}
        />
      )}

      {/* Client Step Read-Only (SUBMITTED/UNDER_REVIEW/APPROVED) */}
      {!isAdminStep && !isFormationStep && !isEditable && (
        <ClientStepReadOnly
          validationStatus={stepData.currentStepInstance?.validation_status}
          onNavigateNext={navigation.goToNextStep}
          onNavigatePrevious={() => {
            navigation.goToPreviousStep();
            navigation.resetLoadedStep();
          }}
          currentStepIndex={navigation.currentStepIndex}
          totalSteps={totalSteps}
        />
      )}

      <DocumentPreviewModal
        isOpen={preview.showPreview}
        document={preview.previewDocument}
        previewUrl={preview.previewUrl}
        isLoading={preview.previewLoading}
        dossierId={dossierId}
        onClose={preview.handleClosePreview}
      />
    </div>
  );
}
