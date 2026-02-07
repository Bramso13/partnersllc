"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { DossierAllData } from "@/lib/agent/dossiers";

interface DossierStepFieldsSectionProps {
  fields: DossierAllData["step_instances"][number]["fields"];
}

export function DossierStepFieldsSection({
  fields,
}: DossierStepFieldsSectionProps) {
  const t = useTranslations("agent.dossierDetail");
  const [copiedFieldIndex, setCopiedFieldIndex] = useState<number | null>(null);

  const handleCopyField = async (
    field: DossierAllData["step_instances"][number]["fields"][number],
    index: number
  ) => {
    const valueToCopy = renderFieldValue(field);

    if (valueToCopy === t("notProvided")) {
      toast.error(t("noValueToCopy"));
      return;
    }

    try {
      await navigator.clipboard.writeText(valueToCopy);
      setCopiedFieldIndex(index);
      toast.success(t("copyValue"));

      // Reset the check icon after 2 seconds
      setTimeout(() => {
        setCopiedFieldIndex(null);
      }, 2000);
    } catch (error) {
      console.error("Error copying field value:", error);
      toast.error(t("notProvided"));
    }
  };

  const renderFieldValue = (
    field: DossierAllData["step_instances"][number]["fields"][number]
  ): string => {
    if (!field.value && !field.value_jsonb) {
      return t("notProvided");
    }

    // Handle JSONB values (arrays, objects)
    if (field.value_jsonb !== null && field.value_jsonb !== undefined) {
      if (Array.isArray(field.value_jsonb)) {
        return field.value_jsonb.join(", ");
      }
      if (typeof field.value_jsonb === "object") {
        return JSON.stringify(field.value_jsonb, null, 2);
      }
      return String(field.value_jsonb);
    }

    // Handle simple text value
    if (field.value !== null && field.value !== undefined) {
      // Try to parse as date
      if (/^\d{4}-\d{2}-\d{2}/.test(field.value)) {
        try {
          return new Date(field.value).toLocaleDateString("en-GB");
        } catch {
          // Not a valid date, return as is
        }
      }
      // Check if it's a boolean
      if (field.value === "true" || field.value === "1") {
        return t("yes");
      }
      if (field.value === "false" || field.value === "0") {
        return t("no");
      }
      return field.value;
    }

    return t("notProvided");
  };

  return (
    <div className="border border-[#363636] rounded-2xl bg-[#191A1D] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#363636]">
        <h3 className="text-lg font-semibold text-brand-text-primary">
          {t("clientInfo")}
        </h3>
        <p className="text-sm text-brand-text-secondary mt-0.5">
          {t("clientInfoSub")}
        </p>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field, index) => {
            const displayValue = renderFieldValue(field);
            const isEmpty = displayValue === t("notProvided");

            return (
              <div
                key={field.field_key || index}
                className="p-4 rounded-xl bg-[#2A2B2F] relative group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-brand-text-secondary">
                    {field.field_label || field.field_key}
                  </div>
                  {!isEmpty && (
                    <button
                      onClick={() => handleCopyField(field, index)}
                      className="p-1.5 rounded-lg hover:bg-[#363636] transition-colors text-brand-text-secondary hover:text-brand-text-primary opacity-0 group-hover:opacity-100"
                      title={t("copyValue")}
                    >
                      {copiedFieldIndex === index ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                <div
                  className={`text-brand-text-primary ${
                    isEmpty ? "text-brand-text-secondary italic" : "font-medium"
                  } ${
                    typeof field.value_jsonb === "object" &&
                    !Array.isArray(field.value_jsonb)
                      ? "whitespace-pre-wrap text-xs"
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
            {t("noCustomFields")}
          </div>
        )}
      </div>
    </div>
  );
}
