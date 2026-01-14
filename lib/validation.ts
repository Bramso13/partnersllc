import { StepField } from "@/types/qualification";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a single field value
 */
export function validateField(
  field: StepField,
  value: any
): string | null {
  // Check required
  if (field.is_required) {
    if (value === null || value === undefined || value === "") {
      return `${field.label} est requis`;
    }
    if (Array.isArray(value) && value.length === 0) {
      return `${field.label} est requis`;
    }
  }

  // If empty and not required, skip other validations
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  const stringValue = String(value);

  // Email validation
  if (field.field_type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(stringValue)) {
      return "Format d'email invalide";
    }
  }

  // Phone validation (international format)
  if (field.field_type === "phone") {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(stringValue.replace(/\s/g, ""))) {
      return "Format de téléphone invalide (utilisez le format international: +33 6 12 34 56 78)";
    }
  }

  // Date validation
  if (field.field_type === "date") {
    const date = new Date(stringValue);
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    // Check min age if specified in validation rules
    if (field.pattern && field.pattern.includes("minAge")) {
      const minAgeMatch = field.pattern.match(/minAge["\s:]*(\d+)/);
      if (minAgeMatch) {
        const minAge = parseInt(minAgeMatch[1]);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < date.getDate())
        ) {
          if (age - 1 < minAge) {
            return `Vous devez avoir au moins ${minAge} ans`;
          }
        } else if (age < minAge) {
          return `Vous devez avoir au moins ${minAge} ans`;
        }
      }
    }
  }

  // Length validation
  if (field.min_length && stringValue.length < field.min_length) {
    return `Minimum ${field.min_length} caractères requis`;
  }
  if (field.max_length && stringValue.length > field.max_length) {
    return `Maximum ${field.max_length} caractères autorisés`;
  }

  // Pattern validation
  if (field.pattern) {
    try {
      const regex = new RegExp(field.pattern);
      if (!regex.test(stringValue)) {
        return "Format invalide";
      }
    } catch {
      // Invalid regex, skip pattern validation
    }
  }

  // Number validation (for text fields that might contain numbers)
  if (field.field_type === "text") {
    if (field.min_value !== null && !isNaN(Number(stringValue))) {
      if (Number(stringValue) < field.min_value) {
        return `La valeur minimale est ${field.min_value}`;
      }
    }
    if (field.max_value !== null && !isNaN(Number(stringValue))) {
      if (Number(stringValue) > field.max_value) {
        return `La valeur maximale est ${field.max_value}`;
      }
    }
  }

  return null;
}

/**
 * Validate all fields in the form
 */
export function validateForm(
  formData: Record<string, any>,
  fields: StepField[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = formData[field.field_key];
    const error = validateField(field, value);
    if (error) {
      errors[field.field_key] = error;
    }
  }

  return errors;
}

/**
 * Check if form is valid
 */
export function isFormValid(
  formData: Record<string, any>,
  fields: StepField[]
): boolean {
  const errors = validateForm(formData, fields);
  return Object.keys(errors).length === 0;
}
