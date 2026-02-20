// Product types for admin product management

export type ProductType =
  | "LLC"
  | "CORP"
  | "DUBAI"
  | "BANKING"
  | "COMPLIANCE"
  | "OTHER";

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  dossier_type: ProductType;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  price_amount: number; // in cents
  currency: string;
  active: boolean;
  is_deposit: boolean;
  is_test?: boolean;
  full_product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  type: ProductType;
  price: number; // in dollars for display
  stripe_product_id?: string;
  stripe_price_id?: string;
  active: boolean;
  is_deposit?: boolean;
  is_test?: boolean;
  full_product_id?: string | null;
}

export type StepType = "CLIENT" | "ADMIN" | "FORMATION" | "TIMER";

export interface Step {
  id: string;
  code: string;
  label: string;
  description: string | null;
  position: number;
  step_type: StepType;
  /** For step_type FORMATION: which formation to display. */
  formation_id?: string | null;
  /** Populated by join: formation(id, titre). */
  formation?: { id: string; titre: string } | null;
  /** For step_type TIMER: delay in minutes before next step is available. */
  timer_delay_minutes?: number | null;
  created_at: string;
}

export interface ProductStep {
  id: string;
  product_id: string;
  step_id: string;
  position: number;
  is_required: boolean;
  estimated_duration_hours: number | null;
  /** Optional dossier status to apply when this step is approved. */
  dossier_status_on_approval?: string | null;
  /** Populated from step: for step_type FORMATION. */
  formation_id?: string | null;
  /** Populated from step: for step_type TIMER. */
  timer_delay_minutes?: number | null;
  created_at: string;
  step?: Step;
}

export interface DocumentType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  required_step_id: string | null;
  max_file_size_mb: number;
  allowed_extensions: string[];
  created_at: string;
  updated_at: string;
}

export interface StepDocumentType {
  id: string;
  step_id: string;
  document_type_id: string;
  created_at: string;
  document_type?: DocumentType;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "file";

export interface StepField {
  id: string;
  step_id: string;
  field_key: string;
  label: string;
  description: string | null;
  placeholder: string | null;
  field_type: FieldType;
  is_required: boolean;
  min_length: number | null;
  max_length: number | null;
  min_value: number | null;
  max_value: number | null;
  pattern: string | null;
  options: { value: string; label: string }[];
  help_text: string | null;
  default_value: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWorkflowConfig {
  product_id: string;
  steps: (ProductStep & {
    step: Step;
    document_types: DocumentType[];
    custom_fields: StepField[];
  })[];
}

/** Step config stored in a workflow template (same format as POST workflow payload) */
export interface WorkflowTemplateStep {
  step_id: string;
  position: number;
  is_required: boolean;
  estimated_duration_hours: number | null;
  dossier_status_on_approval: string | null;
  document_type_ids: string[];
  custom_fields: Omit<
    StepField,
    "id" | "step_id" | "created_at" | "updated_at"
  >[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  steps: WorkflowTemplateStep[];
  created_at: string;
  updated_at: string;
}
