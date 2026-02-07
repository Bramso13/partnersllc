"use client";

import { useState, useEffect } from "react";
import { ProductStep } from "@/lib/workflow";
import { WorkflowStepper, type StepInstanceForTimer } from "./WorkflowStepper";
import { Product } from "@/types/qualification";

interface WorkflowContainerProps {
  dossierId: string;
  productId: string;
  productName: string;
  userId?: string;
  initialStepId?: string;
}

export function WorkflowContainer({
  dossierId,
  productId,
  productName,
  userId,
  initialStepId,
}: WorkflowContainerProps) {
  const [productSteps, setProductSteps] = useState<ProductStep[]>([]);
  const [stepInstances, setStepInstances] = useState<StepInstanceForTimer[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProductSteps = async () => {
      try {
        const response = await fetch(
          `/api/workflow/product-steps?product_id=${productId}`
        );
        if (!response.ok) throw new Error("Failed to load product steps");
        const steps = await response.json();
        setProductSteps(steps);
      } catch (err) {
        console.error("Error loading product steps:", err);
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    };

    loadProductSteps();
  }, [productId]);

  useEffect(() => {
    const loadStepInstances = async () => {
      try {
        const response = await fetch(`/api/dossiers/${dossierId}`);
        if (!response.ok) return;
        const dossier = await response.json();
        const instances = (dossier.step_instances ?? []).map(
          (si: { step_id: string; completed_at: string | null }) => ({
            step_id: si.step_id,
            completed_at: si.completed_at ?? null,
          })
        );
        setStepInstances(instances);
      } catch {
        setStepInstances([]);
      }
    };

    loadStepInstances();
  }, [dossierId]);

  const handleStepComplete = async (
    stepId: string,
    fieldValues: Record<string, any>
  ) => {
    const response = await fetch("/api/workflow/submit-step", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dossier_id: dossierId,
        step_id: stepId,
        field_values: fieldValues,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erreur lors de la soumission");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-brand-danger">{error}</p>
      </div>
    );
  }

  if (productSteps.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-brand-text-secondary">
          Aucune étape configurée pour ce produit.
        </p>
      </div>
    );
  }

  return (
    <WorkflowStepper
      productSteps={productSteps}
      dossierId={dossierId}
      productName={productName}
      userId={userId}
      onStepComplete={handleStepComplete}
      initialStepId={initialStepId}
      stepInstances={stepInstances}
    />
  );
}
