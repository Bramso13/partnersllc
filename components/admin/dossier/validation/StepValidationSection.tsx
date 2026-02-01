"use client";

import { useState, useEffect } from "react";
import { StepValidationCard } from "./StepValidationCard";

export interface StepFieldValue {
  id: string;
  step_instance_id: string;
  step_field_id: string;
  value: string | null;
  value_jsonb: Record<string, unknown> | null;
  validation_status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  field_label: string;
  field_type: string;
  is_required: boolean;
}

export interface DocumentVersion {
  id: string;
  file_url: string;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface StepDocument {
  id: string;
  dossier_id: string;
  document_type_id: string;
  step_instance_id: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "OUTDATED";
  created_at: string;
  updated_at: string;
  document_type_label: string;
  document_type_code: string;
  current_version: DocumentVersion | null;
}

export interface StepInstanceWithFields {
  id: string;
  dossier_id: string;
  step_id: string;
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  validation_status:
    | "DRAFT"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED";
  rejection_reason: string | null;
  validated_by: string | null;
  validated_at: string | null;
  step_label: string;
  step_description: string | null;
  approved_fields_count: number;
  total_fields_count: number;
  approved_documents_count: number;
  total_documents_count: number;
  fields: StepFieldValue[];
  documents: StepDocument[];
}

interface StepValidationSectionProps {
  dossierId: string;
}

export function StepValidationSection({
  dossierId,
}: StepValidationSectionProps) {
  const [stepInstances, setStepInstances] = useState<StepInstanceWithFields[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSteps = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/validation`
      );
      if (!response.ok) throw new Error("Erreur chargement étapes");
      const data = await response.json();
      setStepInstances(data.stepInstances ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSteps();
  }, [dossierId]);

  if (loading) {
    return (
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-6 flex items-center justify-center min-h-[120px]">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-[#50b989]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-6 text-center">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button
          type="button"
          onClick={fetchSteps}
          className="text-sm text-[#50b989] hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (stepInstances.length === 0) {
    return (
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-6">
        <h2 className="text-base font-semibold text-[#f9f9f9] mb-2">
          Validation des étapes
        </h2>
        <p className="text-sm text-[#b7b7b7]">
          Aucune étape à valider pour ce dossier.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#363636] flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#f9f9f9]">
          Validation des étapes
        </h2>
        <button
          type="button"
          onClick={fetchSteps}
          className="text-[#b7b7b7] hover:text-[#f9f9f9] transition-colors p-1"
          title="Actualiser"
        >
          <i className="fa-solid fa-arrows-rotate" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {stepInstances.map((step) => (
          <StepValidationCard
            key={step.id}
            stepInstance={step}
            onRefresh={fetchSteps}
          />
        ))}
      </div>
    </div>
  );
}
