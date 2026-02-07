"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ProductStep, Step } from "@/lib/workflow";
import { StepField } from "@/types/qualification";
import { DynamicFormField } from "@/components/qualification/DynamicFormField";
import { validateForm, isFormValid } from "@/lib/validation";
import { StepDocuments } from "./StepDocuments";
import type { StepInstance } from "@/types/dossiers";
import type {
  FormationSummary,
  FormationWithElements,
  UserFormationProgress,
} from "@/types/formations";
import { FormationParcours } from "@/components/dashboard/FormationParcours";
import { toast } from "sonner";

/** Step instance with completed_at for TIMER next_step_available_at calculation */
export interface StepInstanceForTimer {
  step_id: string;
  completed_at: string | null;
}

interface WorkflowStepperProps {
  productSteps: ProductStep[];
  dossierId: string;
  productName: string;
  userId?: string;
  onStepComplete: (
    stepId: string,
    fieldValues: Record<string, any>
  ) => Promise<void>;
  initialStepId?: string;
  /** Optional: for TIMER steps, used to compute next_step_available_at */
  stepInstances?: StepInstanceForTimer[];
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
  userId,
  onStepComplete,
  initialStepId,
  stepInstances = [],
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [stepFormations, setStepFormations] = useState<FormationSummary[]>([]);
  const [formationFull, setFormationFull] =
    useState<FormationWithElements | null>(null);
  const [formationProgress, setFormationProgress] =
    useState<UserFormationProgress | null>(null);
  const [formationLoading, setFormationLoading] = useState(false);

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
        // Check if this is an admin step or formation step (no fields/documents to load)
        const stepIsAdmin = step?.step?.step_type === "ADMIN";
        const stepIsFormation = step?.step?.step_type === "FORMATION";

        // First, get step instance for this step (will be created in DRAFT if it doesn't exist)
        const instanceResponse = await fetch(
          `/api/workflow/step-instance?dossier_id=${dossierId}&step_id=${stepId}`
        );
        let stepInstance: StepInstance | null = null;
        if (instanceResponse.ok) {
          stepInstance = await instanceResponse.json();
          if (stepInstance) {
            console.log("[WORKFLOW STEPPER] Step instance:", stepInstance);
            setCurrentStepInstance(stepInstance);
          }
        }

        // Load fields with values if step instance exists (only for client steps, not ADMIN/FORMATION)
        const stepInstanceId = stepInstance?.id;
        let fields: StepFieldWithValidation[] = [];
        if (!stepIsAdmin && !stepIsFormation) {
          const fieldsUrl = stepInstanceId
            ? `/api/workflow/step-fields?step_id=${stepId}&step_instance_id=${stepInstanceId}`
            : `/api/workflow/step-fields?step_id=${stepId}`;

          const fieldsResponse = await fetch(fieldsUrl);
          if (!fieldsResponse.ok) throw new Error("Failed to load step fields");
          fields = await fieldsResponse.json();
          setCurrentStepFields(fields);
        } else {
          // Admin and FORMATION steps don't have fields
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

        // Formations: for FORMATION step use product_step.formation; else fetch by-step (recommended)
        if (stepIsFormation && (step as ProductStep).formation) {
          setStepFormations([(step as ProductStep).formation!]);
          // Fetch full formation with elements for inline display
          const fid =
            (step as ProductStep).formation_id ??
            (step as ProductStep).formation?.id ??
            (step as ProductStep).step?.formation_id;
          if (fid) {
            setFormationLoading(true);
            try {
              const formRes = await fetch(`/api/formations/${fid}`);
              if (formRes.ok) {
                const { formation, progress } = await formRes.json();
                setFormationFull(formation ?? null);
                setFormationProgress(progress ?? null);
              } else {
                setFormationFull(null);
                setFormationProgress(null);
              }
            } catch {
              setFormationFull(null);
              setFormationProgress(null);
            } finally {
              setFormationLoading(false);
            }
          } else {
            setFormationFull(null);
            setFormationProgress(null);
          }
        } else {
          setFormationFull(null);
          setFormationProgress(null);
          const formationsRes = await fetch(
            `/api/formations/by-step/${stepId}`
          );
          if (formationsRes.ok) {
            const formationsData = await formationsRes.json();
            setStepFormations(formationsData.formations ?? []);
          } else {
            setStepFormations([]);
          }
        }

        // Initialize form data with existing values or defaults (only for client steps)
        if (!stepIsAdmin && fields.length > 0) {
          const initialData: Record<string, any> = {};
          fields.forEach((field: StepFieldWithValidation) => {
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

  // Check if current step is an admin step or formation step
  const isAdminStep = currentStep?.step?.step_type === "ADMIN";
  const isFormationStep = currentStep?.step?.step_type === "FORMATION";

  // TIMER: compute next_step_available_at for step at index i (step after a TIMER)
  const getNextStepAvailableAt = (stepIndex: number): number | null => {
    if (stepIndex < 1) return null;
    const prevProductStep = productSteps[stepIndex - 1];
    if (
      prevProductStep?.step?.step_type !== "TIMER" ||
      !prevProductStep.timer_delay_minutes
    )
      return null;
    const stepBeforeTimer = productSteps[stepIndex - 2];
    if (!stepBeforeTimer?.step_id) return null;
    const completedAt = stepInstances.find(
      (si) => si.step_id === stepBeforeTimer.step_id
    )?.completed_at;
    if (!completedAt) return null;
    return (
      new Date(completedAt).getTime() +
      prevProductStep.timer_delay_minutes * 60 * 1000
    );
  };

  // When on a TIMER step, the *next* step is blocked until delay after previous step completion
  const nextStepAvailableAt = getNextStepAvailableAt(currentStepIndex + 1);
  const isNextStepBlockedByTimer =
    nextStepAvailableAt != null && Date.now() < nextStepAvailableAt;
  const timerRemainingMinutes =
    nextStepAvailableAt != null && nextStepAvailableAt > Date.now()
      ? Math.ceil((nextStepAvailableAt - Date.now()) / 60000)
      : 0;

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
    // SUBMITTED, UNDER_REVIEW, and APPROVED: no editing
    return false;
  };

  const getStepMessage = () => {
    // Don't show message for admin steps (they have their own display)
    if (isAdminStep) return null;

    const status = currentStepInstance?.validation_status;
    if (!status || status === "DRAFT") return null;

    switch (status) {
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return {
          type: "info",
          icon: "⏳",
          text: "Votre soumission est en cours de vérification par notre équipe",
        };
      case "APPROVED":
        return {
          type: "success",
          icon: "✓",
          text: "Étape validée avec succès",
        };
      case "REJECTED":
        return {
          type: "error",
          icon: "⚠️",
          text: "Des corrections sont nécessaires. Veuillez modifier les champs indiqués ci-dessous.",
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

        // Navigate to next step after successful resubmission
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
          lastLoadedStepIdRef.current = null; // Reset to allow loading next step
        } else {
          // If this was the last step, redirect to dashboard
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Error resubmitting step:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Erreur lors de la resoumission"
        );
      } finally {
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

        // Navigate to next step after successful submission
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
          lastLoadedStepIdRef.current = null; // Reset to allow loading next step
        } else {
          // If this was the last step, redirect to dashboard
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Error submitting step:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Erreur lors de la soumission"
        );
      } finally {
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

  const handleViewDocument = async (doc: any) => {
    try {
      setPreviewLoading(true);
      setShowPreview(true);
      setPreviewDocument(doc);

      // Utiliser l'endpoint de téléchargement existant pour récupérer le document
      const viewUrl = `/api/dossiers/${dossierId}/documents/${doc.id}/download`;

      const response = await fetch(viewUrl);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement du document");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Error viewing document:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du document"
      );
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setShowPreview(false);
    setPreviewDocument(null);
  };

  const formIsValid = isFormValid(formData, currentStepFields);
  const stepMessage = getStepMessage();

  // Determine if user can edit based on step type and validation status
  const canEdit = () => {
    // Admin steps are never editable by client
    if (isAdminStep) return false;

    // Client steps: allow editing only for DRAFT and REJECTED
    if (!currentStepInstance) return true;
    return (
      currentStepInstance.validation_status === "DRAFT" ||
      currentStepInstance.validation_status === "REJECTED"
    );
  };

  const isEditable = canEdit();

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
            // TIMER: step after a TIMER is locked until delay elapsed
            const nextAvailableAt = getNextStepAvailableAt(index);
            const isLocked =
              nextAvailableAt != null && Date.now() < nextAvailableAt;

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

      {/* TIMER: message when next step is blocked by delay */}
      {isNextStepBlockedByTimer && (
        <div className="mb-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-2 text-amber-400">
            <i className="fa-solid fa-clock text-lg" />
            <span className="text-sm font-medium">
              Prochaine étape disponible dans {timerRemainingMinutes} min
            </span>
          </div>
          <p className="text-xs text-brand-text-secondary mt-1">
            Un délai de réflexion est en cours après l&apos;étape précédente.
          </p>
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

      {/* Formation à suivre (step type FORMATION) — affichage inline */}
      {isFormationStep &&
        (currentStep?.formation_id || currentStep?.formation) && (
          <div className="mb-6">
            {formationLoading ? (
              <div className="rounded-xl border border-brand-border bg-brand-card p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-accent border-t-transparent" />
                <span className="ml-4 text-brand-text-secondary">
                  Chargement de la formation...
                </span>
              </div>
            ) : formationFull ? (
              <div className="rounded-xl border border-brand-border bg-brand-card overflow-hidden shadow-lg">
                <FormationParcours
                  formation={formationFull}
                  progress={formationProgress}
                  userId={userId ?? ""}
                  embedded
                />
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-brand-border bg-brand-card">
                <h3 className="text-base font-semibold text-brand-text-primary mb-3">
                  Formation à suivre
                </h3>
                {currentStep.formation ? (
                  <Link
                    href={`/dashboard/formation/${currentStep.formation.id}`}
                    className="inline-flex items-center gap-2 text-brand-accent hover:underline font-medium"
                  >
                    {currentStep.formation.titre}
                    <i className="fa-solid fa-arrow-right text-sm" />
                  </Link>
                ) : (
                  <span className="text-brand-text-secondary">
                    Formation (ID: {currentStep.formation_id})
                  </span>
                )}
              </div>
            )}
          </div>
        )}

      {/* Formations recommandées (Story 12.4 - non-FORMATION steps) */}
      {!isFormationStep && stepFormations.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-brand-border bg-brand-card">
          <h3 className="text-base font-semibold text-brand-text-primary mb-3">
            Formations recommandées pour cette étape
          </h3>
          <ul className="space-y-2">
            {stepFormations.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/dashboard/formation/${f.id}`}
                  className="text-brand-accent hover:underline font-medium"
                >
                  {f.titre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Admin Step Display */}
      {isAdminStep && (
        <div className="bg-brand-card border border-brand-border rounded-lg p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-brand-warning/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-shield text-brand-warning text-xl"></i>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-brand-text-primary mb-2">
                Étape gérée par votre conseiller
              </h3>
              <p className="text-sm text-brand-text-secondary">
                {currentStepInstance?.completed_at
                  ? "Votre conseiller a complété cette étape. Les documents sont disponibles ci-dessous."
                  : currentStepInstance?.started_at
                    ? "Votre conseiller travaille actuellement sur cette étape. Vous recevrez une notification lorsque les documents seront disponibles."
                    : "Cette étape sera traitée par votre conseiller. Vous recevrez une notification lorsqu'elle sera complétée."}
              </p>
            </div>
          </div>

          {/* Admin Step Status */}
          {currentStepInstance && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    currentStepInstance.completed_at
                      ? "bg-brand-success/20 text-brand-success"
                      : currentStepInstance.started_at
                        ? "bg-brand-warning/20 text-brand-warning"
                        : "bg-brand-dark-surface text-brand-text-secondary"
                  }`}
                >
                  {currentStepInstance.completed_at
                    ? "✓ Complété"
                    : currentStepInstance.started_at
                      ? "⏳ En cours"
                      : "⏸ En attente"}
                </span>
                {currentStepInstance.completed_at && (
                  <span className="text-sm text-brand-text-secondary">
                    le{" "}
                    {new Date(
                      currentStepInstance.completed_at
                    ).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              {/* Documents Received from Admin */}
              {currentStepInstance.completed_at && (
                <div className="border-t border-brand-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-brand-text-primary">
                      Documents disponibles
                    </h4>
                    {uploadedDocuments.length > 0 && (
                      <span className="text-sm text-brand-text-secondary">
                        {uploadedDocuments.length} document
                        {uploadedDocuments.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {uploadedDocuments.length > 0 ? (
                    <div id="admin-step-documents" className="space-y-3">
                      {uploadedDocuments.map((doc: any) => {
                        const fileName =
                          doc.current_version?.file_name ||
                          doc.file_name ||
                          "Document";
                        const uploadedAt =
                          doc.current_version?.uploaded_at || doc.created_at;
                        const fileSize =
                          doc.current_version?.file_size_bytes ||
                          doc.file_size_bytes;

                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 bg-brand-dark-bg rounded-lg border border-brand-border hover:border-brand-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                                  <i className="fas fa-file-pdf text-brand-primary"></i>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-brand-text-primary truncate">
                                  {fileName}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  {uploadedAt && (
                                    <p className="text-xs text-brand-text-secondary">
                                      {new Date(uploadedAt).toLocaleDateString(
                                        "fr-FR",
                                        {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        }
                                      )}
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
                              <button
                                onClick={() => handleViewDocument(doc)}
                                className="px-3 py-2 text-sm bg-brand-dark-surface text-brand-text-primary rounded-lg hover:bg-brand-dark-surface/80 transition-colors"
                                title="Prévisualiser"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <a
                                href={`/api/dossiers/${dossierId}/documents/${doc.id}/download`}
                                download
                                className="px-4 py-2 text-sm bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
                                title="Télécharger"
                              >
                                <i className="fas fa-download mr-2"></i>
                                Télécharger
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-brand-dark-bg rounded-lg border border-brand-border border-dashed">
                      <i className="fas fa-inbox text-3xl text-brand-text-secondary mb-3"></i>
                      <p className="text-sm font-medium text-brand-text-secondary">
                        Aucun document disponible
                      </p>
                      <p className="text-xs text-brand-text-secondary mt-1">
                        Votre conseiller n'a pas encore ajouté de documents
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons for admin steps */}
          <div className="pt-6 border-t border-brand-border flex items-center justify-between mt-6">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStepIndex(currentStepIndex - 1);
                  lastLoadedStepIdRef.current = null;
                }}
                className="px-6 py-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Étape précédente
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (currentStepIndex < totalSteps - 1) {
                  setCurrentStepIndex(currentStepIndex + 1);
                  lastLoadedStepIdRef.current = null;
                } else {
                  window.location.href = "/dashboard";
                }
              }}
              disabled={isNextStepBlockedByTimer}
              className="ml-auto px-8 py-3.5 rounded-xl font-semibold text-base
                bg-brand-accent text-brand-dark-bg
                transition-all duration-300
                hover:opacity-90 hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(0,240,255,0.3)]
                flex items-center justify-center gap-2"
            >
              {currentStepIndex === totalSteps - 1 ? (
                "Retour au tableau de bord"
              ) : (
                <>
                  Étape suivante
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FORMATION step: formation link + Passer à l'étape suivante */}
      {isFormationStep && (
        <div className="bg-brand-card border border-brand-border rounded-lg p-6">
          <p className="text-sm text-brand-text-secondary mb-6">
            Consultez la formation ci-dessus puis passez à l&apos;étape
            suivante.
          </p>
          <div className="pt-6 border-t border-brand-border flex items-center justify-between">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStepIndex(currentStepIndex - 1);
                  lastLoadedStepIdRef.current = null;
                }}
                className="px-6 py-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Étape précédente
              </button>
            )}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await onStepComplete(currentStep.step_id, {});
                  if (currentStepIndex < totalSteps - 1) {
                    setCurrentStepIndex(currentStepIndex + 1);
                    lastLoadedStepIdRef.current = null;
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
                  setIsSubmitting(false);
                }
              }}
              className="ml-auto px-8 py-3.5 rounded-xl font-semibold text-base bg-brand-accent text-brand-dark-bg transition-all duration-300 hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Enregistrement...</span>
              ) : currentStepIndex === totalSteps - 1 ? (
                "Retour au tableau de bord"
              ) : (
                <>
                  Passer à l&apos;étape suivante
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Form for Client Steps (not ADMIN, not FORMATION) */}
      {!isAdminStep && !isFormationStep && isEditable ? (
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
                onClick={() => {
                  setCurrentStepIndex(currentStepIndex - 1);
                  lastLoadedStepIdRef.current = null;
                }}
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
                currentStepFields.length === 0 ||
                isNextStepBlockedByTimer
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
      ) : null}

      {/* Read-only view for submitted/approved client steps */}
      {!isAdminStep && !isEditable && (
        <div className="bg-brand-card border border-brand-border rounded-lg p-8">
          <div className="text-center mb-6">
            {currentStepInstance?.validation_status === "APPROVED" ? (
              <>
                <div className="w-16 h-16 bg-brand-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-brand-success text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
                  Étape validée avec succès
                </h3>
                <p className="text-brand-text-secondary">
                  Cette étape a été approuvée par notre équipe. Les informations
                  ne peuvent plus être modifiées.
                </p>
              </>
            ) : currentStepInstance?.validation_status === "UNDER_REVIEW" ||
              currentStepInstance?.validation_status === "SUBMITTED" ? (
              <>
                <div className="w-16 h-16 bg-brand-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-hourglass-half text-brand-warning text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
                  Étape en cours de vérification
                </h3>
                <p className="text-brand-text-secondary mb-4">
                  Votre soumission est actuellement examinée par notre équipe.
                  Vous recevrez une notification dès que la vérification sera
                  terminée.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-dark-surface rounded-lg text-sm text-brand-text-secondary">
                  <i className="fas fa-lightbulb text-brand-accent"></i>
                  <span>
                    Vous pouvez continuer avec les étapes suivantes pendant ce
                    temps
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-brand-dark-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-info-circle text-brand-text-secondary text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
                  Étape en lecture seule
                </h3>
                <p className="text-brand-text-secondary">
                  Cette étape ne peut pas être modifiée pour le moment.
                </p>
              </>
            )}
          </div>

          <div className="pt-6 border-t border-brand-border flex items-center justify-between">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStepIndex(currentStepIndex - 1);
                  lastLoadedStepIdRef.current = null;
                }}
                className="px-6 py-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Étape précédente
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
                "Retour au tableau de bord"
              ) : (
                <>
                  Étape suivante
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-dark-surface rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-dark-border">
              <div>
                <h2 className="text-xl font-bold text-brand-text-primary">
                  {previewDocument?.current_version?.file_name ||
                    previewDocument?.file_name ||
                    "Document"}
                </h2>
                <p className="text-sm text-brand-text-secondary mt-1">
                  {previewDocument?.document_type_label || "Document"}
                </p>
              </div>
              <button
                onClick={handleClosePreview}
                className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-2"
                aria-label="Fermer"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-6">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-brand-text-secondary mb-4"></i>
                    <p className="text-brand-text-secondary">
                      Chargement du document...
                    </p>
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  {previewDocument?.current_version?.mime_type?.startsWith(
                    "image/"
                  ) || previewDocument?.mime_type?.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={
                        previewDocument?.current_version?.file_name ||
                        previewDocument?.file_name ||
                        "Document"
                      }
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : previewDocument?.current_version?.mime_type ===
                      "application/pdf" ||
                    previewDocument?.mime_type === "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full min-h-[600px] rounded-lg border border-brand-dark-border"
                      title={
                        previewDocument?.current_version?.file_name ||
                        previewDocument?.file_name ||
                        "Document PDF"
                      }
                    />
                  ) : (
                    <div className="text-center">
                      <i className="fa-solid fa-file text-6xl text-brand-text-secondary mb-4"></i>
                      <p className="text-brand-text-primary mb-4">
                        Aperçu non disponible pour ce type de fichier
                      </p>
                      <a
                        href={`/api/dossiers/${dossierId}/documents/${previewDocument?.id}/download`}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-dark-bg rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <i className="fa-solid fa-download"></i>
                        <span>Télécharger le document</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
