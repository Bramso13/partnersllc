"use client";

import { StepField } from "@/types/qualification";
import { validateField } from "@/lib/validation";
import { ValidationStatusBadge } from "@/components/workflow/ValidationStatusBadge";

interface DynamicFormFieldProps {
  field: StepField;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  onBlur?: () => void;
  validationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  disabled?: boolean;
}

export function DynamicFormField({
  field,
  value,
  error,
  onChange,
  onBlur,
  validationStatus = "PENDING",
  rejectionReason,
  disabled = false,
}: DynamicFormFieldProps) {
  const fieldId = `field-${field.id}`;
  const errorId = `${fieldId}-error`;
  const hasError = !!error;
  const isRejected = validationStatus === "REJECTED";

  const baseInputClasses = `
    w-full px-4 py-3 rounded-xl
    bg-[#1A1B1E] border transition-all duration-200
    text-sm text-brand-text-primary
    placeholder:text-brand-text-secondary
    focus:outline-none focus:ring-3
    disabled:opacity-50 disabled:cursor-not-allowed
    ${hasError || isRejected
      ? "border-brand-danger focus:border-brand-danger focus:ring-brand-danger/10" 
      : "border-brand-dark-border focus:border-brand-accent focus:ring-brand-accent/10"
    }
  `;

  const renderField = () => {
    switch (field.field_type) {
      case "text":
      case "email":
      case "phone":
        return (
          <input
            id={fieldId}
            type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : "text"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder || ""}
            required={field.is_required}
            aria-required={field.is_required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={baseInputClasses}
            maxLength={field.max_length || undefined}
            minLength={field.min_length || undefined}
            disabled={disabled}
          />
        );

      case "date":
        return (
          <input
            id={fieldId}
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            required={field.is_required}
            aria-required={field.is_required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={baseInputClasses}
          />
        );

      case "textarea":
        return (
          <textarea
            id={fieldId}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder || ""}
            required={field.is_required}
            aria-required={field.is_required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={`${baseInputClasses} min-h-[128px] resize-y`}
            maxLength={field.max_length || undefined}
            minLength={field.min_length || undefined}
            disabled={disabled}
          />
        );

      case "select":
        const selectOptions = Array.isArray(field.options)
          ? field.options.map((opt) =>
              typeof opt === "string"
                ? { value: opt, label: opt }
                : opt
            )
          : [];
        return (
          <select
            id={fieldId}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            required={field.is_required}
            aria-required={field.is_required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={`${baseInputClasses} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23B7B7B7' d='M6 9L1 4h10z'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_16px_center] pr-10`}
            disabled={disabled}
          >
            <option value="">Sélectionner...</option>
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "radio":
        const radioOptions = Array.isArray(field.options)
          ? field.options.map((opt) =>
              typeof opt === "string"
                ? { value: opt, label: opt }
                : opt
            )
          : [];
        return (
          <div className="space-y-3">
            {radioOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name={fieldId}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  required={field.is_required}
                  aria-required={field.is_required}
                  disabled={disabled}
                  className="w-5 h-5 border-2 border-brand-dark-border rounded-full appearance-none cursor-pointer transition-all duration-200
                    checked:bg-brand-accent checked:border-brand-accent
                    focus:outline-none focus:ring-2 focus:ring-brand-accent/30
                    group-hover:border-brand-accent/50
                    disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundImage:
                      value === option.value
                        ? `radial-gradient(circle, #191A1D 35%, transparent 40%)`
                        : "none",
                  }}
                />
                <span className="text-sm text-brand-text-primary">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        const checkboxOptions = Array.isArray(field.options)
          ? field.options.map((opt) =>
              typeof opt === "string"
                ? { value: opt, label: opt }
                : opt
            )
          : [];
        
        // For single checkbox (accept terms)
        if (checkboxOptions.length === 1) {
          const isChecked = !!value;
          return (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onChange(e.target.checked)}
                onBlur={onBlur}
                required={field.is_required}
                aria-required={field.is_required}
                disabled={disabled}
                className="mt-0.5 w-5 h-5 border-2 border-brand-dark-border rounded appearance-none cursor-pointer transition-all duration-200
                  checked:bg-brand-accent checked:border-brand-accent
                  focus:outline-none focus:ring-2 focus:ring-brand-accent/30
                  group-hover:border-brand-accent/50
                  disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundImage: isChecked
                    ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23191A1D' d='M10 3L4.5 8.5L2 6l1.5-1.5L4.5 6l4-4z'/%3E%3C/svg%3E")`
                    : "none",
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />
              <span className="text-sm text-brand-text-primary flex-1">
                {checkboxOptions[0].label}
              </span>
            </label>
          );
        }

        // For multiple checkboxes
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {checkboxOptions.map((option) => {
              const isChecked = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...selectedValues, option.value]);
                      } else {
                        onChange(
                          selectedValues.filter((v) => v !== option.value)
                        );
                      }
                    }}
                    onBlur={onBlur}
                    disabled={disabled}
                    className="w-5 h-5 border-2 border-brand-dark-border rounded appearance-none cursor-pointer transition-all duration-200
                      checked:bg-brand-accent checked:border-brand-accent
                      focus:outline-none focus:ring-2 focus:ring-brand-accent/30
                      group-hover:border-brand-accent/50
                      disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundImage: isChecked
                        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23191A1D' d='M10 3L4.5 8.5L2 6l1.5-1.5L4.5 6l4-4z'/%3E%3C/svg%3E")`
                        : "none",
                      backgroundSize: "contain",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                  <span className="text-sm text-brand-text-primary">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        );

      default:
        return (
          <input
            id={fieldId}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder || ""}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-brand-text-primary"
        >
          {field.label}
          {field.is_required && (
            <span className="text-brand-danger ml-1">*</span>
          )}
        </label>
        <ValidationStatusBadge
          status={validationStatus}
          rejectionReason={rejectionReason}
        />
      </div>

      {field.description && (
        <p className="text-xs text-brand-text-secondary">{field.description}</p>
      )}

      {renderField()}

      {isRejected && rejectionReason && (
        <div className="flex items-start gap-2 text-xs text-brand-danger mt-1.5">
          <span>⚠️</span>
          <span>{rejectionReason}</span>
        </div>
      )}

      {hasError && (
        <div
          id={errorId}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-danger mt-1.5"
          role="alert"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {field.help_text && !hasError && !isRejected && (
        <p className="text-xs text-brand-text-secondary mt-1.5">
          {field.help_text}
        </p>
      )}
    </div>
  );
}
