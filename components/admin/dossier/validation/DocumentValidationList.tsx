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
      <div className="text-center py-6 text-brand-text-secondary">
        <p>Aucun document à valider pour cette étape.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <DocumentValidationItem
          key={document.id}
          document={document}
          dossierId={dossierId}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
