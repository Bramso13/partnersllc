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
      <p className="text-xs text-[#b7b7b7] py-2 text-center">
        Aucun champ à valider pour cette étape.
      </p>
    );
  }

  return (
    <div className="space-y-2">
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
