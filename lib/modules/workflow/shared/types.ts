export type StepType = "CLIENT" | "ADMIN" | "FORMATION" | "TIMER";

export interface Step {
  id: string;
  code: string;
  label: string;
  description: string | null;
  position: number;
  step_type?: StepType;
  formation_id?: string | null;
  timer_delay_minutes?: number | null;
}

export interface DocumentType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  max_file_size_mb: number;
  allowed_extensions: string[];
}

export interface FormationSummary {
  id: string;
  titre: string;
}

export interface ProductStep {
  id: string;
  product_id: string;
  step_id: string;
  position: number;
  is_required: boolean;
  estimated_duration_hours: number | null;
  dossier_status_on_approval?: string | null;
  formation_id?: string | null;
  timer_delay_minutes?: number | null;
  step: Step;
  document_types: DocumentType[];
  formation?: FormationSummary | null;
}

export interface ProductWithSteps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  steps: ProductStep[];
}

export interface StepInstanceWithStep {
  id: string;
  dossier_id: string;
  step_id: string;
  started_at: string | null;
  completed_at: string | null;
  step: Step;
}
