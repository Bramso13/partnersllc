"use client";

import type { VerificateurStepDetails } from "@/lib/agent-steps";

interface StepFieldsSectionProps {
  fields: VerificateurStepDetails["fields"];
}

export function StepFieldsSection({ fields }: StepFieldsSectionProps) {
  const renderFieldValue = (
    field: VerificateurStepDetails["fields"][number]
  ): string => {
    const { value } = field;

    if (!value) {
      return "Non renseigne";
    }

    // Handle JSONB values (arrays, objects)
    if (value.value_jsonb !== null && value.value_jsonb !== undefined) {
      if (Array.isArray(value.value_jsonb)) {
        return value.value_jsonb.join(", ");
      }
      if (typeof value.value_jsonb === "object") {
        return JSON.stringify(value.value_jsonb);
      }
      return String(value.value_jsonb);
    }

    // Handle simple text value
    if (value.value !== null && value.value !== undefined) {
      // Format based on field type
      switch (field.field.field_type) {
        case "date":
          try {
            return new Date(value.value).toLocaleDateString("fr-FR");
          } catch {
            return value.value;
          }
        case "checkbox":
          return value.value === "true" || value.value === "1" ? "Oui" : "Non";
        default:
          return value.value;
      }
    }

    return "Non renseigne";
  };

  return (
    <div className="border border-[#363636] rounded-2xl bg-[#191A1D] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#363636]">
        <h2 className="text-lg font-semibold text-brand-text-primary">
          Informations client
        </h2>
        <p className="text-sm text-brand-text-secondary mt-0.5">
          Donnees saisies par le client (lecture seule)
        </p>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((fieldItem) => {
            const displayValue = renderFieldValue(fieldItem);
            const isEmpty = displayValue === "Non renseigne";

            return (
              <div
                key={fieldItem.field.id}
                className={`p-4 rounded-xl bg-[#2A2B2F] ${
                  fieldItem.field.field_type === "textarea"
                    ? "sm:col-span-2"
                    : ""
                }`}
              >
                <div className="text-sm text-brand-text-secondary mb-1">
                  {fieldItem.field.label}
                </div>
                <div
                  className={`text-brand-text-primary ${
                    isEmpty ? "text-brand-text-secondary italic" : "font-medium"
                  } ${
                    fieldItem.field.field_type === "textarea"
                      ? "whitespace-pre-wrap"
                      : ""
                  }`}
                >
                  {displayValue}
                </div>
              </div>
            );
          })}
        </div>

        {fields.length === 0 && (
          <div className="text-center text-brand-text-secondary py-4">
            Aucun champ personnalise pour cette etape.
          </div>
        )}
      </div>
    </div>
  );
}
