import type { ValidationErrorPanelProps } from "../types";

/**
 * ValidationErrorPanel Component
 *
 * Displays validation errors in a dismissible panel.
 * Shows a list of fields with errors and their error messages.
 */
export function ValidationErrorPanel({
  errors,
  fields,
  isVisible,
  onDismiss,
}: ValidationErrorPanelProps) {
  if (!isVisible || Object.keys(errors).length === 0) return null;

  return (
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
              const field = fields.find((f) => f.field_key === fieldKey);
              return (
                <li key={fieldKey} className="flex items-start gap-2 text-sm">
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
          onClick={onDismiss}
          className="flex-shrink-0 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          aria-label="Fermer les erreurs"
        >
          <i className="fa-solid fa-times"></i>
        </button>
      </div>
    </div>
  );
}
