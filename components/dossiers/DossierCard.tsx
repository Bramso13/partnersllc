"use client";

import Link from "next/link";
import type { DossierWithDetails } from "@/types/dossiers";
import { formatDate } from "@/lib/utils";

interface DossierCardProps {
  dossier: DossierWithDetails;
}

export function DossierCard({ dossier }: DossierCardProps) {
  const statusLabel = getStatusLabel(dossier.status);
  const statusColor = getStatusColor(dossier.status);
  const progress = dossier.progress_percentage || 0;
  const currentStepTitle =
    dossier.current_step_instance?.step?.label || "Aucune étape";

  return (
    <Link href={`/dashboard/dossier/${dossier.id}`}>
      <div className="bg-brand-dark-surface border border-brand-dark-border rounded-xl p-6 hover:translate-y-[-4px] hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* Header: Product Name and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-brand-text-primary mb-1 line-clamp-2">
              {dossier.product?.name || "Dossier sans produit"}
            </h3>
          </div>
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusColor.bg} ${statusColor.text} border ${statusColor.border} ml-3 flex-shrink-0`}
          >
            <span className="text-xs font-medium">{statusLabel}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-brand-text-secondary">
              Progression
            </span>
            <span className="text-sm font-bold text-brand-text-primary">
              {progress}%
            </span>
          </div>
          <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-brand-dark-bg">
            <div
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#50B88A] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-4 flex-1">
          <p className="text-xs text-brand-text-secondary mb-1">
            Étape actuelle
          </p>
          <p className="text-sm font-medium text-brand-text-primary">
            {currentStepTitle}
          </p>
        </div>

        {/* Footer: Created Date */}
        <div className="pt-4 border-t border-brand-dark-border">
          <p className="text-xs text-brand-text-secondary">
            Créé le {formatDate(dossier.created_at)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    QUALIFICATION: "Qualification",
    FORM_SUBMITTED: "Formulaire soumis",
    NM_PENDING: "En attente NM",
    LLC_ACCEPTED: "LLC acceptée",
    EIN_PENDING: "En attente EIN",
    BANK_PREPARATION: "Préparation bancaire",
    BANK_OPENED: "Compte ouvert",
    WAITING_48H: "Attente 48h",
    CLOSED: "Fermé",
    ERROR: "Erreur",
  };
  return statusMap[status] || status;
}

function getStatusColor(status: string) {
  if (
    status === "QUALIFICATION" ||
    status === "FORM_SUBMITTED" ||
    status === "NM_PENDING" ||
    status === "EIN_PENDING" ||
    status === "BANK_PREPARATION" ||
    status === "WAITING_48H"
  ) {
    return {
      bg: "bg-brand-warning/10",
      text: "text-brand-warning",
      border: "border-brand-warning",
    };
  }
  if (
    status === "CLOSED" ||
    status === "LLC_ACCEPTED" ||
    status === "BANK_OPENED"
  ) {
    return {
      bg: "bg-brand-success/10",
      text: "text-brand-success",
      border: "border-brand-success",
    };
  }
  if (status === "ERROR") {
    return {
      bg: "bg-brand-danger/10",
      text: "text-brand-danger",
      border: "border-brand-danger",
    };
  }
  return {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500",
  };
}
