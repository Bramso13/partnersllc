"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ProductStep, Step } from "@/lib/workflow";
import { StepField } from "@/types/qualification";
import { DynamicFormField } from "@/components/qualification/DynamicFormField";
import { validateForm, isFormValid } from "@/lib/validation";
import { StepDocuments } from "./StepDocuments";
import { StepInstance } from "@/lib/dossiers";

interface WorkflowStepperProps {
  productSteps: ProductStep[];
  dossierId: string;
  productName: string;
  onStepComplete: (
    stepId: string,
    fieldValues: Record<string, any>
  ) => Promise<void>;
  initialStepId?: string;
}

interface StepFieldWithValidation extends StepField {
  currentValue?: any;
  validationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}

// StepInstance is imported from @/lib/dossiers

export function WorkflowStepper({
  productSteps,
  dossierId,
  productName,
  onStepComplete,
  initialStepId,
}: WorkflowStepperProps) {
  // Initialize with step from URL if provided, otherwise start at 0
  const getInitialStepIndex = () => {
    if (initialStepId) {
      const index = productSteps.findIndex(
        (ps) => ps.step_id === initialStepId
      );
      return index >= 0 ? index : 0;
    }
    return 0;
  };

  const [currentStepIndex, setCurrentStepIndex] = useState(
    getInitialStepIndex()
  );
  const [currentStepFields, setCurrentStepFields] = useState<
    StepFieldWithValidation[]
  >([]);
  const [currentStepInstance, setCurrentStepInstance] =
    useState<StepInstance | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const lastLoadedStepIdRef = useRef<string | null>(null);

  const currentStep = productSteps[currentStepIndex];
  console.log(
    "[WORKFLOW STEPPER] Current step document types:",
    currentStep.document_types
  );
  const totalSteps = productSteps.length;

  // Load step instance and fields for current step
  useEffect(() => {
    const step = productSteps[currentStepIndex];

    console.log("[WORKFLOW STEPPER] Current step:", step);
    if (!step?.step_id) return;

    const stepId = step.step_id;

    // Skip if we're already loading/loaded this step
    if (lastLoadedStepIdRef.current === stepId) return;

    // Mark this step as being loaded immediately to prevent duplicate calls
    lastLoadedStepIdRef.current = stepId;

    const loadStepData = async () => {
      setIsLoading(true);
      try {
        // Check if this is an admin step
        const stepIsAdmin = step?.step?.step_type === "ADMIN";

        // First, get step instance for this step (will be created in DRAFT if it doesn't exist)
        const instanceResponse = await fetch(
          `/api/workflow/step-instance?dossier_id=${dossierId}&step_id=${stepId}`
        );
        let stepInstance: StepInstance | null = null;
        if (instanceResponse.ok) {
          stepInstance = await instanceResponse.json();
          if (stepInstance) {
            setCurrentStepInstance(stepInstance);
          }
        }

        // Load fields with values if step instance exists (only for client steps)
        const stepInstanceId = stepInstance?.id;
        let fields: StepFieldWithValidation[] = [];
        if (!stepIsAdmin) {
          const fieldsUrl = stepInstanceId
            ? `/api/workflow/step-fields?step_id=${stepId}&step_instance_id=${stepInstanceId}`
            : `/api/workflow/step-fields?step_id=${stepId}`;

          const fieldsResponse = await fetch(fieldsUrl);
          if (!fieldsResponse.ok) throw new Error("Failed to load step fields");
          fields = await fieldsResponse.json();
          setCurrentStepFields(fields);
        } else {
          // Admin steps don't have fields
          setCurrentStepFields([]);
        }

        // Load uploaded documents for this dossier
        const docsUrl = stepInstanceId
          ? `/api/workflow/dossier-documents?dossier_id=${dossierId}&step_instance_id=${stepInstanceId}`
          : `/api/workflow/dossier-documents?dossier_id=${dossierId}`;

        console.log("[WorkflowStepper] Loading documents from:", docsUrl);
        const docsResponse = await fetch(docsUrl);
        console.log(
          "[WorkflowStepper] Documents response status:",
          docsResponse.status
        );
        if (docsResponse.ok) {
          const docs = await docsResponse.json();
          console.log("[WorkflowStepper] Documents loaded:", docs);
          // For admin steps, filter to only show documents uploaded by agents
          // For client steps, show all documents
          const filteredDocs = stepIsAdmin
            ? docs.filter((doc: any) => {
                const uploadedByType = doc.current_version?.uploaded_by_type;
                return uploadedByType === "AGENT";
              })
            : docs;
          console.log("[WorkflowStepper] Filtered documents:", {
            isAdminStep: stepIsAdmin,
            totalDocs: docs.length,
            filteredDocs: filteredDocs.length,
          });
          setUploadedDocuments(filteredDocs);
        } else {
          console.error(
            "[WorkflowStepper] Failed to load documents:",
            await docsResponse.text()
          );
          setUploadedDocuments([]);
        }

        // Initialize form data with existing values or defaults (only for client steps)
        if (!stepIsAdmin && fields.length > 0) {
          const initialData: Record<string, any> = {};
          fields.forEach((field: StepFieldWithValidation) => {
            if (field.currentValue !== undefined && field.currentValue !== null) {
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
          setFormData(initialData);
        } else {
          // Admin steps or steps without fields don't have form data
          setFormData({});
        }
        setErrors({});
        setTouched({});
      } catch (error) {
        // Reset ref on error so we can retry
        lastLoadedStepIdRef.current = null;
        console.error("Error loading step data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStepData();
  }, [currentStepIndex, dossierId]);

  const canProceedToNext = () => {
    // Allow users to proceed to next step regardless of validation status
    return true;
  };

  const canEditField = (field: StepFieldWithValidation) => {
    const status = currentStepInstance?.validation_status;
    if (!status || status === "DRAFT") return true;
    if (status === "REJECTED") {
      // Allow editing all fields when rejected, not just rejected ones
      return true;
    }
    if (status === "SUBMITTED" || status === "UNDER_REVIEW") {
      // Allow editing even when submitted or under review
      return true;
    }
    // APPROVED: no editing (keep this restriction)
    return false;
  };

  const getStepMessage = () => {
    const status = currentStepInstance?.validation_status;
    if (!status || status === "DRAFT") return null;

    switch (status) {
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return {
          type: "info",
          icon: "⏳",
          text: "En attente de validation par notre équipe",
        };
      case "APPROVED":
        return {
          type: "success",
          icon: "✓",
          text: "Étape validée",
        };
      case "REJECTED":
        return {
          type: "error",
          icon: "❌",
          text: "Cette étape nécessite des corrections. Veuillez corriger les champs rejetés.",
        };
      default:
        return null;
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));

    if (errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        // Hide validation errors section if no errors remain
        if (Object.keys(newErrors).length === 0) {
          setShowValidationErrors(false);
        }
        return newErrors;
      });
    }
  };

  const handleFieldBlur = (field: StepField) => {
    setTouched((prev) => ({ ...prev, [field.field_key]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    currentStepFields.forEach((field) => {
      allTouched[field.field_key] = true;
    });
    setTouched(allTouched);

    // If this is a resubmit (REJECTED status), only validate rejected fields
    const isResubmit = currentStepInstance?.validation_status === "REJECTED";

    if (isResubmit) {
      // Only validate rejected fields that are being corrected
      const rejectedFields = currentStepFields.filter(
        (f) => f.validationStatus === "REJECTED"
      );
      const rejectedFieldValues: Record<string, any> = {};
      rejectedFields.forEach((field) => {
        rejectedFieldValues[field.field_key] = formData[field.field_key];
      });

      const validationErrors = validateForm(
        rejectedFieldValues,
        rejectedFields
      );
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setShowValidationErrors(true);
        const firstErrorField = Object.keys(validationErrors)[0];
        const element = document.getElementById(
          `field-${rejectedFields.find((f) => f.field_key === firstErrorField)?.id}`
        );
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      // Resubmit only corrected rejected fields
      setIsSubmitting(true);
      setShowValidationErrors(false);
      try {
        if (!currentStepInstance?.id) {
          throw new Error("Instance d'étape introuvable");
        }

        const response = await fetch("/api/workflow/resubmit-step", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step_instance_id: currentStepInstance.id,
            corrected_fields: rejectedFieldValues,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Erreur lors de la resoumission"
          );
        }

        // Reload step data to get updated validation status
        window.location.reload();
      } catch (error) {
        console.error("Error resubmitting step:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Erreur lors de la resoumission"
        );
        setIsSubmitting(false);
      }
    } else {
      // Normal submit - validate all fields
      const validationErrors = validateForm(formData, currentStepFields);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setShowValidationErrors(true);
        const firstErrorField = Object.keys(validationErrors)[0];
        const element = document.getElementById(
          `field-${currentStepFields.find((f) => f.field_key === firstErrorField)?.id}`
        );
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      setIsSubmitting(true);
      setShowValidationErrors(false);
      try {
        await onStepComplete(currentStep.step_id, formData);

        // Reload step data to get updated validation status
        window.location.reload();
      } catch (error) {
        console.error("Error submitting step:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Erreur lors de la soumission"
        );
        setIsSubmitting(false);
      }
    }
  };

  const handleNext = () => {
    // Allow navigation to next step without validation requirement
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const formIsValid = isFormValid(formData, currentStepFields);
  const stepMessage = getStepMessage();
  // Allow editing regardless of validation status, except for APPROVED steps
  // This gives users freedom to work on any step without dependencies
  const canEdit =
    !currentStepInstance ||
    currentStepInstance.validation_status === "DRAFT" ||
    currentStepInstance.validation_status === "REJECTED" ||
    currentStepInstance.validation_status === "SUBMITTED" ||
    currentStepInstance.validation_status === "UNDER_REVIEW";
  
  // Check if current step is an admin step
  const isAdminStep = currentStep?.step?.step_type === "ADMIN";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-brand-text-primary">
              {currentStep.step.label}
            </h2>
            {isAdminStep && (
              <span className="px-2 py-1 bg-brand-warning/20 text-brand-warning rounded text-xs font-medium">
                Action admin
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-brand-text-secondary">
            Étape {currentStepIndex + 1} sur {totalSteps}
          </span>
        </div>
        {currentStep.step.description && (
          <p className="text-brand-text-secondary mb-4">
            {currentStep.step.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-brand-dark-surface rounded-full h-2">
          <div
            className="bg-brand-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Navigation */}
      {totalSteps > 1 && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {productSteps.map((step, index) => {
            const isApproved = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            // Allow navigation to any step - no locking based on validation
            const isLocked = false;

            return (
              <div
                key={step.id}
                className={`flex items-center ${
                  isApproved
                    ? "text-brand-success"
                    : isCurrent
                      ? "text-brand-accent"
                      : "text-brand-text-secondary"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all ${
                    isApproved
                      ? "bg-brand-success border-brand-success text-white"
                      : isCurrent
                        ? "bg-brand-accent border-brand-accent text-brand-dark-bg"
                        : "bg-transparent border-brand-dark-border"
                  }`}
                >
                  {isApproved ? (
                    <i className="fa-solid fa-check text-xs"></i>
                  ) : isLocked ? (
                    <i className="fa-solid fa-lock text-xs"></i>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      isApproved ? "bg-brand-success" : "bg-brand-dark-border"
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step Status Message */}
      {stepMessage && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            stepMessage.type === "error"
              ? "bg-brand-danger/10 border border-brand-danger"
              : stepMessage.type === "success"
                ? "bg-brand-success/10 border border-brand-success"
                : "bg-brand-warning/10 border border-brand-warning"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{stepMessage.icon}</span>
            <span className="text-sm">{stepMessage.text}</span>
          </div>
        </div>
      )}

      {/* Admin Step Display */}
      {isAdminStep && (
        <div className="bg-brand-card border border-brand-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-brand-text-primary mb-2">
                Étape gérée par l'administrateur
              </h3>
              <p className="text-sm text-brand-text-secondary">
                Cette étape est gérée par votre conseiller. Vous recevrez une notification lorsque des documents seront disponibles.
              </p>
            </div>
          </div>

          {/* Admin Step Status */}
          {currentStepInstance && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    currentStepInstance.completed_at
                      ? "bg-green-500/20 text-green-400"
                      : currentStepInstance.started_at
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {currentStepInstance.completed_at
                    ? "Terminé"
                    : currentStepInstance.started_at
                      ? "En cours"
                      : "En attente"}
                </span>
                {currentStepInstance.completed_at && (
                  <span className="text-sm text-brand-text-secondary">
                    Complété le:{" "}
                    {new Date(
                      currentStepInstance.completed_at
                    ).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>

              {/* Documents Received from Admin */}
              {currentStepInstance.completed_at && (
                <div className="mt-4 border-t border-brand-border pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-brand-text-primary">
                      Documents reçus
                    </h4>
                    {uploadedDocuments.length > 0 && (
                      <button
                        onClick={() => {
                          // Scroll to documents section
                          const docsSection = document.getElementById("admin-step-documents");
                          if (docsSection) {
                            docsSection.scrollIntoView({ behavior: "smooth", block: "center" });
                            // Highlight briefly
                            docsSection.classList.add("ring-2", "ring-brand-accent");
                            setTimeout(() => {
                              docsSection.classList.remove("ring-2", "ring-brand-accent");
                            }, 2000);
                          }
                        }}
                        className="px-5 py-2.5 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors text-sm font-semibold shadow-lg"
                      >
                        <i className="fas fa-download mr-2"></i>
                        Récupérer mes documents
                      </button>
                    )}
                  </div>
                  {uploadedDocuments.length > 0 ? (
                    <div id="admin-step-documents" className="space-y-3">
                      {uploadedDocuments.map((doc: any) => {
                        // Handle both API response formats
                        const fileName = doc.current_version?.file_name || doc.file_name || "Document";
                        const uploadedAt = doc.current_version?.uploaded_at || doc.created_at;
                        const fileSize = doc.current_version?.file_size_bytes || doc.file_size_bytes;

                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 bg-brand-dark-bg rounded-lg border border-brand-border hover:border-brand-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                                  <i className="fas fa-file text-brand-primary text-xl"></i>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-brand-text-primary truncate">
                                  {fileName}
                                </p>
                                <div className="flex items-center gap-4 mt-1">
                                  {uploadedAt && (
                                    <p className="text-xs text-brand-text-secondary">
                                      Reçu le:{" "}
                                      {new Date(uploadedAt).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </p>
                                  )}
                                  {fileSize && (
                                    <p className="text-xs text-brand-text-secondary">
                                      {(fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <a
                                href={`/api/dossiers/${dossierId}/documents/${doc.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 text-sm bg-brand-dark-surface text-brand-text-primary rounded hover:bg-brand-dark-surface/80 transition-colors"
                                title="Voir"
                              >
                                <i className="fas fa-eye mr-1"></i>
                                Voir
                              </a>
                              <a
                                href={`/api/dossiers/${dossierId}/documents/${doc.id}/download`}
                                download
                                className="px-3 py-1.5 text-sm bg-brand-accent text-white rounded hover:bg-brand-accent/90 transition-colors"
                                title="Télécharger"
                              >
                                <i className="fas fa-download mr-1"></i>
                                Télécharger
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-brand-dark-bg rounded-lg border border-brand-border">
                      <i className="fas fa-file-circle-question text-4xl text-brand-text-secondary mb-4"></i>
                      <p className="text-sm font-medium text-brand-text-secondary mb-2">
                        Aucun document disponible pour le moment
                      </p>
                      <p className="text-xs text-brand-text-secondary">
                        Les documents seront disponibles une fois envoyés par votre conseiller
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {!isAdminStep && canEdit ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStepFields.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-brand-text-secondary">
                Aucun champ à remplir pour cette étape.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentStepFields.map((field, index) => {
                // Group first_name and last_name together
                const isFirstName = field.field_key === "first_name";
                const isLastName = field.field_key === "last_name";
                const fieldCanEdit = canEditField(field);

                if (isFirstName) {
                  const lastNameField = currentStepFields.find(
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
                          onChange={(value) =>
                            handleFieldChange(field.field_key, value)
                          }
                          onBlur={() => handleFieldBlur(field)}
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
                            handleFieldChange(lastNameField.field_key, value)
                          }
                          onBlur={() => handleFieldBlur(lastNameField)}
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
                  const firstNameField = currentStepFields.find(
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
                    onChange={(value) =>
                      handleFieldChange(field.field_key, value)
                    }
                    onBlur={() => handleFieldBlur(field)}
                    validationStatus={field.validationStatus}
                    rejectionReason={field.rejectionReason || undefined}
                    disabled={!fieldCanEdit}
                  />
                );
              })}
            </div>
          )}

          {/* Required Documents Section (only for client steps) */}
          {!isAdminStep &&
            currentStep.document_types &&
            currentStep.document_types.length > 0 &&
            currentStepInstance && (
              <div className="border-t border-brand-dark-border pt-6">
                <StepDocuments
                  dossierId={dossierId}
                  stepInstanceId={currentStepInstance.id}
                  requiredDocuments={currentStep.document_types}
                  uploadedDocuments={uploadedDocuments}
                  onDocumentUploaded={async () => {
                    // Reload documents after upload
                    const stepInstanceId = currentStepInstance?.id;
                    const docsUrl = stepInstanceId
                      ? `/api/workflow/dossier-documents?dossier_id=${dossierId}&step_instance_id=${stepInstanceId}`
                      : `/api/workflow/dossier-documents?dossier_id=${dossierId}`;

                    const docsResponse = await fetch(docsUrl);
                    if (docsResponse.ok) {
                      const docs = await docsResponse.json();
                      setUploadedDocuments(docs);
                    }
                  }}
                />
              </div>
            )}

          {/* Validation Errors Section */}
          {showValidationErrors && Object.keys(errors).length > 0 && (
            <div className="bg-brand-danger/10 border border-brand-danger rounded-lg p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <i className="fa-solid fa-triangle-exclamation text-brand-danger text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-brand-danger font-semibold text-base mb-3">
                    Erreurs de validation détectées
                  </h3>
                  <p className="text-sm text-brand-text-secondary mb-4">
                    Veuillez corriger les erreurs suivantes avant de soumettre :
                  </p>
                  <ul className="space-y-2">
                    {Object.entries(errors).map(([fieldKey, errorMessage]) => {
                      const field = currentStepFields.find(
                        (f) => f.field_key === fieldKey
                      );
                      return (
                        <li
                          key={fieldKey}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-brand-danger mt-1">•</span>
                          <span className="text-brand-text-primary">
                            <span className="font-medium">
                              {field?.label || fieldKey} :{" "}
                            </span>
                            <span className="text-brand-text-secondary">
                              {errorMessage}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValidationErrors(false)}
                  className="flex-shrink-0 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                  aria-label="Fermer les erreurs"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6 border-t border-brand-dark-border flex items-center justify-between">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                className="px-6 py-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Précédent
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || currentStepFields.length === 0}
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
                  <span>Soumission...</span>
                </>
              ) : currentStepInstance?.validation_status === "REJECTED" ? (
                "Corriger et soumettre"
              ) : currentStepIndex === totalSteps - 1 ? (
                "Terminer"
              ) : (
                "Soumettre"
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <p className="text-brand-text-secondary mb-4">
            {currentStepInstance?.validation_status === "APPROVED"
              ? "Cette étape a été approuvée et ne peut plus être modifiée."
              : "Cette étape est en cours de validation. Vous ne pouvez pas la modifier pour le moment."}
          </p>
          <div className="pt-6 border-t border-brand-dark-border flex items-center justify-between">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                className="px-6 py-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Précédent
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto px-8 py-3.5 rounded-xl font-semibold text-base
                transition-all duration-300
                flex items-center justify-center gap-2
                bg-brand-accent text-brand-dark-bg hover:opacity-90 hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(0,240,255,0.3)]"
            >
              {currentStepIndex === totalSteps - 1 ? (
                "Terminer"
              ) : (
                <>
                  Suivant
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
