"use client";

import { FieldValidationItem } from "./FieldValidationItem";
import { StepFieldValue } from "./StepValidationSection";

interface FieldValidationListProps {
  dossierId: string;
  fields: StepFieldValue[];
  onRefresh: () => void;
}

export function FieldValidationList({
  dossierId,
  fields,
  onRefresh,
}: FieldValidationListProps) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-6 text-brand-text-secondary">
        <p>Aucun champ à valider pour cette étape.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <FieldValidationItem
          key={field.id}
          field={field}
          dossierId={dossierId}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
