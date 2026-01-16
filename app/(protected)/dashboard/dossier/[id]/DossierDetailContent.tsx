"use client";

import { useSearchParams } from "next/navigation";
import { DossierWithDetails } from "@/lib/dossiers";
import { ProductStep } from "@/lib/workflow";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { SidebarCards } from "@/components/dashboard/SidebarCards";
import { TimelineSection } from "@/components/dashboard/TimelineSection";
import { DocumentsSection } from "@/components/dashboard/DocumentsSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RejectionWarningBanner } from "@/components/dashboard/RejectionWarningBanner";
import { AdminDeliveredDocumentsSection } from "@/components/dashboard/AdminDeliveredDocumentsSection";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";

interface AdvisorInfo {
  id: string | null;
  name: string;
  email: string;
  role: string;
}

interface DossierDetailContentProps {
  dossier: DossierWithDetails;
  productSteps: ProductStep[];
  initialStepId?: string;
}

export function DossierDetailContent({
  dossier,
  productSteps,
  initialStepId,
}: DossierDetailContentProps) {
  const searchParams = useSearchParams();
  const stepIdFromUrl = searchParams.get("step_id") || initialStepId;

  // Check for rejected steps and count rejected fields - memoize to prevent infinite loops
  const rejectedSteps = useMemo(() => {
    return (
      dossier.step_instances?.filter(
        (si: any) => si.validation_status === "REJECTED"
      ) || []
    );
  }, [dossier.step_instances]);

  // Create a stable string representation of rejected step IDs for dependency tracking
  const rejectedStepIds = useMemo(() => {
    return rejectedSteps.map((s: any) => s.step_id).join(",");
  }, [rejectedSteps]);

  const [rejectedFieldsCount, setRejectedFieldsCount] = useState(0);
  const [rejectedStepId, setRejectedStepId] = useState<string | undefined>();
  const [isLoadingRejections, setIsLoadingRejections] = useState(false);
  const lastFetchedStepIdsRef = useRef<string>("");
  const [advisor, setAdvisor] = useState<AdvisorInfo | undefined>(undefined);

  useEffect(() => {
    // Skip if we've already fetched for these step IDs
    if (lastFetchedStepIdsRef.current === rejectedStepIds) return;
    if (rejectedSteps.length === 0) return;

    // Mark as being fetched
    lastFetchedStepIdsRef.current = rejectedStepIds;

    const fetchRejectedFields = async () => {
      setIsLoadingRejections(true);
      try {
        let totalRejectedFields = 0;
        let firstRejectedStepId: string | undefined;

        for (const rejectedStep of rejectedSteps) {
          const response = await fetch(
            `/api/workflow/step-instance?dossier_id=${dossier.id}&step_id=${rejectedStep.step_id}`
          );

          if (response.ok) {
            const stepInstance = await response.json();
            if (stepInstance) {
              // Fetch rejected fields count
              const fieldsResponse = await fetch(
                `/api/workflow/step-fields?step_id=${rejectedStep.step_id}&step_instance_id=${stepInstance.id}`
              );

              if (fieldsResponse.ok) {
                const fields = await fieldsResponse.json();
                const rejectedFields = fields.filter(
                  (f: any) => f.validationStatus === "REJECTED"
                );

                totalRejectedFields += rejectedFields.length;
                if (!firstRejectedStepId && rejectedFields.length > 0) {
                  firstRejectedStepId = rejectedStep.step_id;
                }
              }
            }
          }
        }

        setRejectedFieldsCount(totalRejectedFields);
        setRejectedStepId(firstRejectedStepId);
      } catch (error) {
        // Reset ref on error so we can retry
        lastFetchedStepIdsRef.current = "";
        console.error("Error fetching rejected fields:", error);
      } finally {
        setIsLoadingRejections(false);
      }
    };

    fetchRejectedFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectedStepIds, dossier.id]);

  // Fetch advisor information
  useEffect(() => {
    const fetchAdvisor = async () => {
      try {
        const response = await fetch(`/api/dossiers/${dossier.id}/advisor`);
        if (response.ok) {
          const advisorData = await response.json();
          setAdvisor(advisorData);
        }
      } catch (error) {
        console.error("Error fetching advisor:", error);
      }
    };

    fetchAdvisor();
  }, [dossier.id]);

  // If step_id is in URL, show workflow
  if (stepIdFromUrl && dossier.product_id) {
    return (
      <div>
        {/* Back button */}
        <Link
          href={`/dashboard/dossier/${dossier.id}`}
          className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-brand-text-primary mb-6 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Retour au dossier</span>
        </Link>

        {/* Rejection Warning Banner */}
        {rejectedFieldsCount > 0 && rejectedStepId && (
          <RejectionWarningBanner
            rejectedFieldsCount={rejectedFieldsCount}
            dossierId={dossier.id}
            stepId={rejectedStepId}
          />
        )}

        <EmptyState
          dossierId={dossier.id}
          productId={dossier.product_id}
          productName={dossier.product?.name || "Produit"}
          rejectedFieldsCount={
            rejectedFieldsCount > 0 ? rejectedFieldsCount : undefined
          }
          rejectedStepId={rejectedStepId}
          currentStepInstance={dossier.current_step_instance as any}
          initialStepId={stepIdFromUrl}
        />
      </div>
    );
  }

  // Otherwise, show dossier detail with all steps
  const estimatedCompletion = dossier.completed_at
    ? null
    : new Date(new Date(dossier.created_at).getTime() + 48 * 60 * 60 * 1000).toISOString();

  return (
    <div>
      {/* Header with back to dashboard */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-brand-text-primary mb-4 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Retour au tableau de bord</span>
        </Link>
        <h1 className="text-3xl font-bold text-brand-text-primary">
          Dossier {dossier.product?.name || "LLC"}
        </h1>
        <p className="text-brand-text-secondary mt-1">
          Gérez votre dossier et complétez les étapes nécessaires
        </p>
      </div>

      {/* Rejection Warning Banner */}
      {!isLoadingRejections && rejectedFieldsCount > 0 && rejectedStepId && (
        <RejectionWarningBanner
          rejectedFieldsCount={rejectedFieldsCount}
          dossierId={dossier.id}
          stepId={rejectedStepId}
        />
      )}

      {/* Progress Overview Section */}
      <div id="progress-overview" className="grid grid-cols-12 gap-6 mb-8">
        <ProgressCard dossier={dossier} productSteps={productSteps} />
        <SidebarCards
          estimatedCompletion={estimatedCompletion || undefined}
          advisor={advisor}
        />
      </div>

      {/* Main Grid Section */}
      <div id="main-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TimelineSection dossier={dossier} />
        {/* <DocumentsSection /> */}
      </div>

      {/* Admin Delivered Documents Section */}
      <div className="mt-6">
        <AdminDeliveredDocumentsSection dossierId={dossier.id} />
      </div>
    </div>
  );
}
