export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "select"
  | "textarea"
  | "checkbox"
  | "radio";

export interface StepField {
  id: string;
  step_id: string;
  field_key: string;
  field_type: FieldType;
  label: string;
  description: string | null;
  placeholder: string | null;
  is_required: boolean;
  min_length: number | null;
  max_length: number | null;
  min_value: number | null;
  max_value: number | null;
  pattern: string | null;
  options: Array<{ value: string; label: string }> | string[] | null;
  help_text: string | null;
  default_value: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  dossier_type: "LLC" | "CORP" | "BANKING";
  price_amount: number;
  currency: string;
  active: boolean;
}

export interface QualificationFormData {
  [fieldKey: string]: string | string[] | boolean;
}
