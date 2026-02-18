"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/api/useApi";
import { Product } from "@/types/qualification";
import { ProductSelectionCard } from "@/components/qualification/ProductSelectionCard";
import { ProductSelectionGrid } from "@/components/qualification/ProductSelectionGrid";
import { WorkflowContainer } from "@/components/workflow/WorkflowContainer";
import { RejectionWarningBanner } from "./RejectionWarningBanner";
import { createDossierFromProduct } from "@/app/actions/qualification";

interface EmptyStateProps {
  products?: Product[];
  dossierId?: string;
  productId?: string;
  productName?: string;
  userId?: string;
  rejectedFieldsCount?: number;
  rejectedStepId?: string;
  currentStepInstance?: {
    id: string;
    validation_status?:
      | "DRAFT"
      | "SUBMITTED"
      | "UNDER_REVIEW"
      | "APPROVED"
      | "REJECTED";
  } | null;
  initialStepId?: string;
}

export function EmptyState({
  products: initialProducts,
  dossierId,
  productId,
  productName,
  userId,
  rejectedFieldsCount,
  rejectedStepId,
  currentStepInstance,
  initialStepId,
}: EmptyStateProps) {
  const searchParams = useSearchParams();

  // Get step_id from URL if present, or use initialStepId prop
  const stepIdFromUrl =
    searchParams.get("step_id") || initialStepId || undefined;

  // If we have a dossier and product, show workflow
  if (dossierId && productId && productName) {
    return (
      <div className="bg-brand-dark-surface border border-brand-dark-border rounded-2xl p-6 md:p-8 shadow-lg">
        {/* Rejection Warning Banner */}
        {rejectedFieldsCount && rejectedFieldsCount > 0 && (
          <RejectionWarningBanner
            rejectedFieldsCount={rejectedFieldsCount}
            dossierId={dossierId}
            stepId={rejectedStepId}
          />
        )}

        <div className="mb-6 pb-6 border-b border-brand-dark-border">
          <p className="text-sm text-brand-text-secondary">
            Produit sélectionné
          </p>
          <p className="text-lg font-semibold text-brand-text-primary mt-1">
            {productName}
          </p>
        </div>

        <WorkflowContainer
          dossierId={dossierId}
          productId={productId}
          productName={productName}
          userId={userId}
          initialStepId={stepIdFromUrl}
        />
      </div>
    );
  }
}
