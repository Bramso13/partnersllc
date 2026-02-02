"use client";

import { useState } from "react";
import type { DossierWithDetails } from "@/types/dossiers";
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

const SIMPLIFIED_VALIDATION = true;

type TabId = "resume" | "etapes" | "documents";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "resume", label: "Résumé", icon: "fa-file-lines" },
  { id: "etapes", label: "Étapes & validation", icon: "fa-list-check" },
  { id: "documents", label: "Documents & livraisons", icon: "fa-folder-open" },
];

function getStatusStyle(status: string) {
  if (status === "COMPLETED")
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (status === "ERROR" || status === "CLOSED")
    return "bg-red-500/15 text-red-400 border-red-500/30";
  return "bg-amber-500/15 text-amber-400 border-amber-500/30";
}

interface AdminDossierDetailContentProps {
  dossier: DossierWithDetails;
  productSteps: ProductStep[];
}

export function AdminDossierDetailContent({
  dossier,
  productSteps,
}: AdminDossierDetailContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>("resume");
  const progress = dossier.progress_percentage ?? 0;
  const completed = dossier.completed_steps_count ?? 0;
  const total = dossier.total_steps_count ?? 1;

  return (
    <div className="min-h-screen bg-[#191a1d]">
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <header className="border-b border-[#363636] bg-[#1e1f22]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-[#b7b7b7] mb-4">
            <Link
              href="/admin/dashboard"
              className="hover:text-[#f9f9f9] transition-colors"
            >
              Tableau de bord
            </Link>
            <span aria-hidden className="text-[#363636]">
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </span>
            <span className="text-[#f9f9f9] font-medium">
              {dossier.product?.name ?? "Dossier"}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#f9f9f9] tracking-tight">
                Dossier {dossier.product?.name ?? "LLC"}
              </h1>
              <p className="text-sm text-[#b7b7b7] mt-0.5">
                ID{" "}
                <code className="font-mono text-xs bg-[#2d3033] px-1.5 py-0.5 rounded">
                  {dossier.id.slice(0, 8)}…
                </code>
                {" · "}
                Vue administrative
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusStyle(dossier.status)}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    dossier.status === "COMPLETED"
                      ? "bg-emerald-400"
                      : dossier.status === "ERROR" ||
                          dossier.status === "CLOSED"
                        ? "bg-red-400"
                        : "bg-amber-400 animate-pulse"
                  }`}
                />
                {dossier.status}
              </span>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[#b7b7b7] mb-1.5">
              <span>Progression</span>
              <span className="font-medium text-[#f9f9f9]">
                {completed} / {total} étapes
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#2d3033] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#50b989] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ─── Tabs + Layout principal ───────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 p-1 rounded-xl bg-[#252628] border border-[#363636] w-fit mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#2d3033] text-[#f9f9f9] shadow-sm"
                  : "text-[#b7b7b7] hover:text-[#f9f9f9] hover:bg-[#2d3033]/50"
              }`}
            >
              <i className={`fa-solid ${tab.icon}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Colonne principale */}
          <main className="lg:col-span-3 space-y-6">
            {activeTab === "resume" && (
              <section className="opacity-100 transition-opacity duration-200">
                <DossierInfoSection
                  dossier={dossier}
                  productSteps={productSteps}
                />
              </section>
            )}

            {activeTab === "etapes" && (
              <section className="space-y-6 opacity-100 transition-opacity duration-200">
                {dossier.product_id && (
                  <AdminStepsSection
                    dossierId={dossier.id}
                    productId={dossier.product_id}
                  />
                )}
                <StepValidationSection dossierId={dossier.id} />
                {!SIMPLIFIED_VALIDATION && (
                  <EventLogSection dossierId={dossier.id} />
                )}
                {!SIMPLIFIED_VALIDATION && (
                  <AuditTrailSection dossierId={dossier.id} />
                )}
              </section>
            )}

            {activeTab === "documents" && (
              <section className="space-y-6 opacity-100 transition-opacity duration-200">
                <DocumentHistorySection dossierId={dossier.id} />
                <AdminDeliveryHistorySection dossierId={dossier.id} />
              </section>
            )}
          </main>

          {/* Sidebar actions */}
          <aside className="lg:col-span-1">
            <AdminActionsSidebar
              dossier={dossier}
              currentStepInstance={dossier.current_step_instance}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
