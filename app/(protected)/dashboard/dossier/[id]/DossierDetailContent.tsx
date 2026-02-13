"use client";

import { useSearchParams } from "next/navigation";
import type { DossierWithDetails } from "@/types/dossiers";
import { ProductStep } from "@/lib/workflow";
import { useDossiers } from "@/lib/contexts/dossiers/DossiersContext";
import { useApi } from "@/lib/api/useApi";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RejectionWarningBanner } from "@/components/dashboard/RejectionWarningBanner";
import { AdminDeliveredDocumentsSection } from "@/components/dashboard/AdminDeliveredDocumentsSection";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  FileText,
  Calendar,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { User } from "@/types/auth";

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
  user: User;
}

export function DossierDetailContent({
  dossier,
  productSteps,
  user,
  initialStepId,
}: DossierDetailContentProps) {
  const t = useTranslations("dashboard.dossier");
  const searchParams = useSearchParams();
  const stepIdFromUrl = searchParams.get("step_id") || initialStepId;
  const { fetchDossierAdvisor } = useDossiers();
  const api = useApi();

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

  // Calculate progress - MUST be before any conditional returns
  const completedSteps = dossier.completed_steps_count || 0;
  const totalSteps = productSteps.length || 0;
  const progressPercent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Get user's first name
  const userName =
    user.user_metadata.full_name || t("hello", { name: "Utilisateur" });

  // Create a complete list of all steps (productSteps) with their instances - MUST be before any conditional returns
  const allStepsWithInstances = useMemo(() => {
    return productSteps.map((productStep) => {
      const stepInstance = dossier.step_instances?.find(
        (si) => si.step_id === productStep.step_id
      );
      return {
        productStep,
        stepInstance: stepInstance || null,
      };
    });
  }, [productSteps, dossier.step_instances]);

  // Separate client steps and admin steps - ALL steps, not just those with instances
  const clientSteps = useMemo(() => {
    return allStepsWithInstances.filter(
      (item) => item.productStep.step.step_type === "CLIENT"
    );
  }, [allStepsWithInstances]);

  const adminSteps = useMemo(() => {
    return allStepsWithInstances.filter(
      (item) => item.productStep.step.step_type === "ADMIN"
    );
  }, [allStepsWithInstances]);

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
          const stepInstance = await api.get<{ id: string }>(
            `/api/workflow/step-instance?dossier_id=${dossier.id}&step_id=${rejectedStep.step_id}`
          );

          if (stepInstance?.id) {
            const fields = await api.get<{ validationStatus?: string }[]>(
              `/api/workflow/step-fields?step_id=${rejectedStep.step_id}&step_instance_id=${stepInstance.id}`
            );
            const rejectedFields = (Array.isArray(fields) ? fields : []).filter(
              (f) => f.validationStatus === "REJECTED"
            );
            totalRejectedFields += rejectedFields.length;
            if (!firstRejectedStepId && rejectedFields.length > 0) {
              firstRejectedStepId = rejectedStep.step_id;
            }
          }
        }

        setRejectedFieldsCount(totalRejectedFields);
        setRejectedStepId(firstRejectedStepId);
      } catch {
        lastFetchedStepIdsRef.current = "";
      } finally {
        setIsLoadingRejections(false);
      }
    };

    fetchRejectedFields();
  }, [rejectedStepIds, dossier.id]);

  // Fetch advisor information
  useEffect(() => {
    let cancelled = false;
    fetchDossierAdvisor(dossier.id).then((advisorData) => {
      if (!cancelled && advisorData) setAdvisor(advisorData);
    });
    return () => {
      cancelled = true;
    };
  }, [dossier.id]);

  // If step_id is in URL, show workflow
  if (stepIdFromUrl && dossier.product_id) {
    return (
      <div>
        {/* Back button */}
        <Link
          href={`/dashboard/dossier/${dossier.id}`}
          className="inline-flex items-center gap-2 text-[#B7B7B7] hover:text-[#F9F9F9] mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{t("backToDossier")}</span>
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
          userId={dossier.user_id}
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0B0D] via-[#121317] to-[#0A0B0D]">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[#B7B7B7] hover:text-[#F9F9F9] mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{t("backToDashboard")}</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-4xl font-bold text-[#F9F9F9] mb-2">
                  {t("hello", { name: userName })}
                </h1>
                <p className="text-[#B7B7B7] text-lg">
                  {t("completeSteps", {
                    product: dossier.product?.name || t("yourLLC"),
                  })}
                </p>
              </div>
              {/* <div className="flex items-center gap-3 items-center justify-center">

                <div className="hidden lg:block w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                  <FileText className="w-12 h-12 text-purple-400" />
                </div>
              </div> */}
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-blue-300">
                  {dossier.status}
                </span>
              </div>
              {advisor && (
                <div className="text-sm text-[#B7B7B7]">
                  <span className="font-medium text-[#F9F9F9]">
                    {t("yourAdvisor")}
                  </span>{" "}
                  {advisor.name}
                </div>
              )}
            </div>
          </div>

          {/* Rejection Warning Banner */}
          {!isLoadingRejections &&
            rejectedFieldsCount > 0 &&
            rejectedStepId && (
              <div className="mb-6">
                <RejectionWarningBanner
                  rejectedFieldsCount={rejectedFieldsCount}
                  dossierId={dossier.id}
                  stepId={rejectedStepId}
                />
              </div>
            )}

          {/* Main Layout: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info Banner */}
              <div className="bg-[#191A1D] border-2 border-[#363636] rounded-3xl p-8 text-center shadow-xl shadow-black/20">
                <h2 className="text-2xl font-bold text-[#F9F9F9] mb-2">
                  {t("beforeWeStart")}
                </h2>
                <p className="text-xl text-[#B7B7B7]">
                  {t("requireDocuments")}
                </p>
              </div>

              {/* CLIENT Steps Section */}
              {clientSteps.length > 0 && (
                <div className="bg-[#191A1D]/50 rounded-3xl p-6 border border-[#363636]/50 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-[#F9F9F9] mb-4">
                    {t("forCompanyCreation")}
                  </h3>
                  <div className="space-y-3">
                    {clientSteps.map((item) => {
                      const { productStep, stepInstance } = item;
                      const validationStatus =
                        stepInstance?.validation_status ?? null;

                      let statusText = t("status.notEntered");
                      let statusColor =
                        "text-red-400 bg-red-500/20 border border-red-500/30";

                      if (validationStatus === "APPROVED") {
                        statusText = t("status.approved");
                        statusColor =
                          "text-green-400 bg-green-500/20 border border-green-500/30";
                      } else if (validationStatus === "REJECTED") {
                        statusText = t("status.rejected");
                        statusColor =
                          "text-red-400 bg-red-500/20 border border-red-500/30";
                      } else if (validationStatus === "UNDER_REVIEW") {
                        statusText = t("status.inReview");
                        statusColor =
                          "text-orange-400 bg-orange-500/20 border border-orange-500/30";
                      } else if (validationStatus === "SUBMITTED") {
                        statusText = t("status.submitted");
                        statusColor =
                          "text-blue-400 bg-blue-500/20 border border-blue-500/30";
                      } else if (validationStatus === "DRAFT") {
                        statusText = t("status.draft");
                        statusColor =
                          "text-[#B7B7B7] bg-[#2A2B2F] border border-[#363636]";
                      }

                      const isCompleted = validationStatus === "APPROVED";

                      return (
                        <Link
                          key={productStep.step_id}
                          href={`/dashboard/dossier/${dossier.id}?step_id=${productStep.step_id}`}
                          className="block group"
                        >
                          <div className="bg-[#1E1F23] border border-[#363636] rounded-2xl p-5 hover:border-[#4A4B4F] hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
                            <div className="flex items-center justify-between gap-4">
                              {/* Left: Status Icon + Label */}
                              <div className="flex items-center gap-4 flex-1">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-6 h-6 text-[#4A4B4F] flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4
                                    className={`font-medium text-base ${
                                      isCompleted
                                        ? "text-[#6B6C70] line-through"
                                        : "text-[#F9F9F9]"
                                    }`}
                                  >
                                    {productStep.step.label ||
                                      productStep.step.code}
                                  </h4>
                                  {productStep.step.description && (
                                    <p className="text-sm text-[#B7B7B7] mt-0.5">
                                      {productStep.step.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right: Status Badge + Arrow */}
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor}`}
                                >
                                  {statusText}
                                </span>
                                <ChevronRight className="w-5 h-5 text-[#6B6C70] group-hover:text-[#B7B7B7] transition-colors" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ADMIN Steps Section (read-only for client) */}
              {adminSteps.length > 0 && (
                <div className="bg-[#191A1D]/50 rounded-3xl p-6 border border-[#363636]/50 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-[#F9F9F9] mb-4">
                    {t("forProcessing")}
                  </h3>
                  <div className="space-y-3">
                    {adminSteps.map((item) => {
                      const { productStep, stepInstance } = item;
                      const validationStatus =
                        stepInstance?.validation_status ?? null;

                      let statusText = t("status.pending");
                      let statusColor =
                        "text-[#B7B7B7] bg-[#2A2B2F] border border-[#363636]";

                      if (validationStatus === "APPROVED") {
                        statusText = t("status.completed");
                        statusColor =
                          "text-green-400 bg-green-500/20 border border-green-500/30";
                      } else if (validationStatus === "REJECTED") {
                        statusText = t("status.rejected");
                        statusColor =
                          "text-red-400 bg-red-500/20 border border-red-500/30";
                      } else if (validationStatus === "UNDER_REVIEW") {
                        statusText = t("status.inReview");
                        statusColor =
                          "text-orange-400 bg-orange-500/20 border border-orange-500/30";
                      } else if (validationStatus === "SUBMITTED") {
                        statusText = t("status.submitted");
                        statusColor =
                          "text-blue-400 bg-blue-500/20 border border-blue-500/30";
                      } else if (validationStatus === "DRAFT") {
                        statusText = t("status.draft");
                        statusColor =
                          "text-[#B7B7B7] bg-[#2A2B2F] border border-[#363636]";
                      }

                      return (
                        <div
                          key={productStep.step_id}
                          className="bg-[#1E1F23] border border-[#363636] rounded-2xl p-5 opacity-60"
                        >
                          <div className="flex items-center justify-between gap-4">
                            {/* Left: Status Icon + Label */}
                            <div className="flex items-center gap-4 flex-1">
                              {validationStatus === "APPROVED" ? (
                                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                              ) : (
                                <Clock className="w-6 h-6 text-[#4A4B4F] flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-base text-[#F9F9F9]">
                                  {productStep.step.label ||
                                    productStep.step.code}
                                </h4>
                                <p className="text-sm text-[#B7B7B7] mt-0.5">
                                  {t("ourTeamWorking")}
                                </p>
                              </div>
                            </div>

                            {/* Right: Status Badge */}
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor}`}
                              >
                                {statusText}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {clientSteps.length === 0 && adminSteps.length === 0 && (
                <div className="bg-[#191A1D] border border-[#363636] rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-[#2A2B2F] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-[#6B6C70]" />
                  </div>
                  <p className="text-[#B7B7B7]">{t("noStepsYet")}</p>
                </div>
              )}
            </div>

            {/* Right Column: Progress Timeline */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-[#191A1D] border border-[#363636] rounded-3xl p-6 shadow-xl shadow-black/20">
                  <h3 className="text-lg font-semibold text-[#F9F9F9] mb-6">
                    {t("progressOverview")}
                  </h3>

                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#B7B7B7]">
                        {t("completion")}
                      </span>
                      <span className="text-sm font-semibold text-[#F9F9F9]">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="h-2 bg-[#2A2B2F] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500 shadow-lg shadow-green-500/30"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#6B6C70] mt-2">
                      {t("stepsCompleted", {
                        completed: completedSteps,
                        total: totalSteps,
                      })}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    {/* Client Steps in Timeline */}
                    {clientSteps.map((item, idx) => {
                      const { productStep, stepInstance } = item;
                      const isCompleted = stepInstance
                        ? !!stepInstance.completed_at
                        : false;
                      const isActive = stepInstance
                        ? stepInstance.id === dossier.current_step_instance_id
                        : false;

                      return (
                        <div
                          key={productStep.step_id}
                          className="flex items-start gap-3"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {isCompleted ? (
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                            ) : isActive ? (
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <span className="text-sm font-semibold text-white">
                                  {idx + 1}
                                </span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-[#2A2B2F] rounded-full flex items-center justify-center border-2 border-[#363636]">
                                <span className="text-sm font-semibold text-[#B7B7B7]">
                                  {idx + 1}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p
                              className={`text-sm font-medium ${isCompleted ? "text-[#6B6C70]" : "text-[#F9F9F9]"}`}
                            >
                              {productStep.step.label || productStep.step.code}
                            </p>
                            {isCompleted && stepInstance?.completed_at && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                                {t("status.completed")}
                              </span>
                            )}
                            {isActive && !isCompleted && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                                {t("status.current")}
                              </span>
                            )}
                            {!isCompleted && !isActive && !stepInstance && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-[#2A2B2F] text-[#6B6C70] text-xs font-medium rounded-full border border-[#363636]">
                                {t("notStarted")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Admin Steps in Timeline */}
                    {adminSteps.map((item, idx) => {
                      const { productStep, stepInstance } = item;
                      const isCompleted = stepInstance
                        ? !!stepInstance.completed_at
                        : false;
                      const isStarted = stepInstance
                        ? !!stepInstance.started_at
                        : false;
                      const stepNumber = clientSteps.length + idx + 1;

                      return (
                        <div
                          key={productStep.step_id}
                          className="flex items-start gap-3 opacity-50"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {isCompleted ? (
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-[#2A2B2F] rounded-full flex items-center justify-center border-2 border-[#363636]">
                                <span className="text-sm font-semibold text-[#B7B7B7]">
                                  {stepNumber}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p
                              className={`text-sm font-medium ${isCompleted ? "text-[#6B6C70]" : "text-[#F9F9F9]"}`}
                            >
                              {productStep.step.label || productStep.step.code}
                            </p>
                            {isCompleted && stepInstance?.completed_at && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                                {t("status.completed")}
                              </span>
                            )}
                            {!isCompleted && isStarted && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-[#2A2B2F] text-[#B7B7B7] text-xs font-medium rounded-full border border-[#363636]">
                                {t("status.inProgress")}
                              </span>
                            )}
                            {!isCompleted && !isStarted && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-[#2A2B2F] text-[#6B6C70] text-xs font-medium rounded-full border border-[#363636]">
                                {t("notStarted")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Estimated Completion */}
                  {!dossier.completed_at && (
                    <div className="mt-8 pt-6 border-t border-[#363636]">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#6B6C70] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-[#F9F9F9]">
                            {t("estimatedCompletion")}
                          </p>
                          <p className="text-sm text-[#B7B7B7] mt-0.5">
                            {t("businessDays")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completed State */}
                  {dossier.completed_at && (
                    <div className="mt-6 pt-6 border-t border-[#363636]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-medium text-[#F9F9F9]">
                            {t("orderDelivered")}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                            {t("complete")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Delivered Documents Section */}
          <div className="mt-8">
            <AdminDeliveredDocumentsSection dossierId={dossier.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
