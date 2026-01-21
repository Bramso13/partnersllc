"use client";

import { DossierWithDetails } from "@/lib/dossiers";
import { ProductStep } from "@/lib/workflow";
import Link from "next/link";
import { AdminActionsSidebar } from "@/components/admin/dossier/AdminActionsSidebar";
import { DossierInfoSection } from "@/components/admin/dossier/DossierInfoSection";
import { EventLogSection } from "@/components/admin/dossier/EventLogSection";
import { DocumentHistorySection } from "@/components/admin/dossier/DocumentHistorySection";
import { AuditTrailSection } from "@/components/admin/dossier/AuditTrailSection";
import { StepValidationSection } from "@/components/admin/dossier/validation/StepValidationSection";
import { AdminStepsSection } from "@/components/admin/dossier/AdminStepsSection";
import { AdminDeliveryHistorySection } from "@/components/admin/dossier/AdminDeliveryHistorySection";

// TODO: Feature flag pour simplification - garder pour réactivation future
const SIMPLIFIED_VALIDATION = true;

interface AdminDossierDetailContentProps {
  dossier: DossierWithDetails;
  productSteps: ProductStep[];
}

export function AdminDossierDetailContent({
  dossier,
  productSteps,
}: AdminDossierDetailContentProps) {
  return (
    <div>
      {/* Header with back to dashboard */}
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-brand-text-primary mb-4 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Retour au tableau de bord</span>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Dossier {dossier.product?.name || "LLC"}
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Vue administrative avec outils de gestion
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                dossier.status === "COMPLETED"
                  ? "bg-green-500/20 text-green-400"
                  : dossier.status === "ERROR" || dossier.status === "CLOSED"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {dossier.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left side - Main Content (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Dossier Information */}
          <DossierInfoSection dossier={dossier} productSteps={productSteps} />

          {/* Admin Steps Section */}
          {dossier.product_id && (
            <AdminStepsSection
              dossierId={dossier.id}
              productId={dossier.product_id}
            />
          )}

          {/* Step Validation Section */}
          <StepValidationSection dossierId={dossier.id} />

          {/* Event Log */}
          {/* TODO: Masqué pour simplification - garder pour réactivation future */}
          {!SIMPLIFIED_VALIDATION && <EventLogSection dossierId={dossier.id} />}

          {/* Document History */}
          <DocumentHistorySection dossierId={dossier.id} />

          {/* Admin Delivery History */}
          <AdminDeliveryHistorySection dossierId={dossier.id} />

          {/* Audit Trail */}
          {/* TODO: Masqué pour simplification - garder pour réactivation future */}
          {!SIMPLIFIED_VALIDATION && <AuditTrailSection dossierId={dossier.id} />}
        </div>

        {/* Right side - Admin Actions Sidebar (1 column) */}
        <div className="lg:col-span-1">
          <AdminActionsSidebar
            dossier={dossier}
            currentStepInstance={dossier.current_step_instance}
          />
        </div>
      </div>
    </div>
  );
}
