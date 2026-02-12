import { ProductStep, DocumentType } from "@/lib/workflow";
import { StepField } from "@/types/qualification";
import { StepInstance } from "@/types/dossiers";
import {
  FormationSummary,
  FormationWithElements,
  UserFormationProgress,
  StepFormationItem,
} from "@/types/formations";
import { ReactNode } from "react";

/** Step instance with completed_at for TIMER next_step_available_at calculation */
export interface StepInstanceForTimer {
  step_id: string;
  completed_at: string | null;
}

// Extended field with validation status
export interface StepFieldWithValidation extends StepField {
  currentValue?: any;
  validationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}

// Step type discriminator
export type StepType = "CLIENT" | "ADMIN" | "FORMATION";

// Form state for useReducer
export interface FormState {
  formData: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  showValidationErrors: boolean;
  isSubmitting: boolean;
}

// Form actions for useReducer
export type FormAction =
  | { type: "FIELD_CHANGE"; payload: { fieldKey: string; value: any } }
  | { type: "FIELD_BLUR"; payload: { fieldKey: string } }
  | { type: "SET_ERRORS"; payload: Record<string, string> }
  | { type: "CLEAR_ERROR"; payload: string }
  | { type: "SHOW_VALIDATION_ERRORS"; payload: boolean }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "RESET_FORM"; payload: Record<string, any> }
  | { type: "SET_ALL_TOUCHED" };

// Main WorkflowStepper props (unchanged for backward compatibility)
export interface WorkflowStepperProps {
  productSteps: ProductStep[];
  dossierId: string;
  productName: string;
  userId?: string;
  onStepComplete: (
    stepId: string,
    fieldValues: Record<string, any>
  ) => Promise<void>;
  initialStepId?: string;
  stepInstances?: StepInstanceForTimer[];
}

// Navigation hook return type
export interface UseStepNavigationReturn {
  currentStepIndex: number;
  goToStep: (index: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  getNextStepAvailableAt: (stepIndex: number) => number | null;
  isNextStepBlockedByTimer: boolean;
  timerRemainingMinutes: number;
  resetLoadedStep: () => void;
}

// Data hook return type
export interface UseStepDataReturn {
  currentStepInstance: StepInstance | null;
  currentStepFields: StepFieldWithValidation[];
  uploadedDocuments: any[];
  stepFormations: FormationSummary[];
  stepFormationItems: StepFormationItem[];
  formationFull: FormationWithElements | null;
  formationProgress: UserFormationProgress | null;
  isLoading: boolean;
  formationLoading: boolean;
  reloadDocuments: () => Promise<void>;
}

// Form hook return type
export interface UseStepFormReturn {
  formData: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  showValidationErrors: boolean;
  isSubmitting: boolean;
  handleFieldChange: (fieldKey: string, value: any) => void;
  handleFieldBlur: (field: StepField) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setShowValidationErrors: (show: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  resetForm: (newFormData: Record<string, any>) => void;
  canEditField: (field: StepFieldWithValidation) => boolean;
}

// Document preview hook return type
export interface UseDocumentPreviewReturn {
  showPreview: boolean;
  previewUrl: string | null;
  previewLoading: boolean;
  previewDocument: any | null;
  handleViewDocument: (doc: any) => Promise<void>;
  handleClosePreview: () => void;
}

// Component Props Interfaces

export interface StepProgressBarProps {
  currentStepIndex: number;
  totalSteps: number;
  currentStepLabel: string;
  currentStepDescription?: string;
  isAdminStep: boolean;
  productSteps: ProductStep[];
  getNextStepAvailableAt: (index: number) => number | null;
}

export interface StepStatusMessageProps {
  validationStatus?: StepInstance["validation_status"];
  isAdminStep: boolean;
}

export interface TimerBlockMessageProps {
  isBlocked: boolean;
  remainingMinutes: number;
}

export interface FormationRecommendationsProps {
  formations: FormationSummary[];
  stepFormationItems: StepFormationItem[];
  isFormationStep: boolean;
}

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  document: any | null;
  previewUrl: string | null;
  isLoading: boolean;
  dossierId: string;
  onClose: () => void;
}

export interface ValidationErrorPanelProps {
  errors: Record<string, string>;
  fields: StepFieldWithValidation[];
  isVisible: boolean;
  onDismiss: () => void;
}

export interface StepNavigationButtonsProps {
  currentStepIndex: number;
  totalSteps: number;
  isAdminStep: boolean;
  isFormationStep: boolean;
  isEditable: boolean;
  isSubmitting: boolean;
  isNextStepBlockedByTimer: boolean;
  validationStatus?: StepInstance["validation_status"];
  fieldsCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: (e: React.FormEvent) => void;
}

export interface AdminStepViewProps {
  currentStepInstance: StepInstance | null;
  uploadedDocuments: any[];
  dossierId: string;
  onViewDocument: (doc: any) => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  currentStepIndex: number;
  totalSteps: number;
  isNextStepBlockedByTimer: boolean;
}

export interface FormationStepViewProps {
  currentStep: ProductStep;
  formationFull: FormationWithElements | null;
  formationProgress: UserFormationProgress | null;
  formationLoading: boolean;
  userId: string;
  isSubmitting: boolean;
  onCompleteFormationStep: () => Promise<void>;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  currentStepIndex: number;
  totalSteps: number;
}

export interface ClientStepFormProps {
  fields: StepFieldWithValidation[];
  formData: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  showValidationErrors: boolean;
  isSubmitting: boolean;
  currentStep: ProductStep;
  currentStepInstance: StepInstance | null;
  uploadedDocuments: any[];
  dossierId: string;
  canEditField: (field: StepFieldWithValidation) => boolean;
  onFieldChange: (fieldKey: string, value: any) => void;
  onFieldBlur: (field: StepField) => void;
  onDocumentUploaded: () => Promise<void>;
  onDismissErrors: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onNavigatePrevious: () => void;
  currentStepIndex: number;
  totalSteps: number;
  isNextStepBlockedByTimer: boolean;
}

export interface ClientStepReadOnlyProps {
  validationStatus?: StepInstance["validation_status"];
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  currentStepIndex: number;
  totalSteps: number;
}

export interface StepTypeRendererProps {
  stepType: "admin" | "formation" | "client";
  isEditable: boolean;
  adminStepViewProps?: AdminStepViewProps;
  formationStepViewProps?: FormationStepViewProps;
  clientStepFormProps?: ClientStepFormProps;
  clientStepReadOnlyProps?: ClientStepReadOnlyProps;
}
