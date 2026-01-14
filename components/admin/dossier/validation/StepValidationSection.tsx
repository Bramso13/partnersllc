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

  const fetchStepInstances = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[STEP VALIDATION] Fetching validation data for dossier:", dossierId);

      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/validation`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des étapes");
      }

      const data = await response.json();
      console.log("[STEP VALIDATION] Received data:", data);
      console.log("[STEP VALIDATION] Number of step instances:", data.stepInstances?.length || 0);
      
      if (data.stepInstances && data.stepInstances.length > 0) {
        data.stepInstances.forEach((step: StepInstanceWithFields, index: number) => {
          console.log(`[STEP VALIDATION] Step ${index + 1}: ${step.step_label}`, {
            fields: step.total_fields_count,
            documents: step.total_documents_count,
            documents_list: step.documents,
          });
        });
      }
      
      setStepInstances(data.stepInstances || []);
    } catch (err) {
      console.error("[STEP VALIDATION] Error fetching step instances:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStepInstances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleRefresh = () => {
    fetchStepInstances();
  };

  if (loading) {
    return (
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="text-brand-accent hover:text-brand-accent-hover"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (stepInstances.length === 0) {
    return (
      <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
          Validation des étapes
        </h2>
        <p className="text-brand-text-secondary">
          Aucune étape à valider pour ce dossier.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-dark-surface border border-brand-stroke rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-brand-text-primary">
          Validation des étapes
        </h2>
        <button
          onClick={handleRefresh}
          className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          title="Actualiser"
        >
          <i className="fa-solid fa-refresh"></i>
        </button>
      </div>

      <div className="space-y-4">
        {stepInstances.map((stepInstance) => (
          <StepValidationCard
            key={stepInstance.id}
            stepInstance={stepInstance}
            onRefresh={handleRefresh}
          />
        ))}
      </div>
    </div>
  );
}
