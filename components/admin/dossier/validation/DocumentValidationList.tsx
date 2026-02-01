"use client";

import { StepDocument } from "./StepValidationSection";
import { DocumentValidationItem } from "./DocumentValidationItem";

interface DocumentValidationListProps {
  dossierId: string;
  documents: StepDocument[];
  onRefresh: () => void;
}

export function DocumentValidationList({
  dossierId,
  documents,
  onRefresh,
}: DocumentValidationListProps) {
  if (documents.length === 0) {
    return (
      <p className="text-xs text-[#b7b7b7] py-2 text-center">
        Aucun document à valider pour cette étape.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocumentValidationItem
          key={doc.id}
          document={doc}
          dossierId={dossierId}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
