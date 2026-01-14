"use client";

import { DossierStatus } from "@/lib/dossiers";
import { useRouter, useSearchParams } from "next/navigation";

interface StatusFilterProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

const STATUS_LABELS: Record<DossierStatus | "all", string> = {
  all: "Tous les statuts",
  QUALIFICATION: "Qualification",
  FORM_SUBMITTED: "Formulaire soumis",
  NM_PENDING: "En attente NM",
  LLC_ACCEPTED: "LLC acceptée",
  EIN_PENDING: "En attente EIN",
  BANK_PREPARATION: "Préparation bancaire",
  BANK_OPENED: "Compte ouvert",
  WAITING_48H: "Attente 48h",
  IN_PROGRESS: "En cours",
  UNDER_REVIEW: "En révision",
  COMPLETED: "Terminé",
  CLOSED: "Fermé",
  ERROR: "Erreur",
};

const STATUS_OPTIONS: (DossierStatus | "all")[] = [
  "all",
  "QUALIFICATION",
  "FORM_SUBMITTED",
  "NM_PENDING",
  "LLC_ACCEPTED",
  "EIN_PENDING",
  "BANK_PREPARATION",
  "BANK_OPENED",
  "WAITING_48H",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "COMPLETED",
  "CLOSED",
  "ERROR",
];

export function StatusFilter({
  selectedStatus,
  onStatusChange,
}: StatusFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <label
        htmlFor="status-filter"
        className="text-sm font-medium text-brand-text-secondary whitespace-nowrap"
      >
        Filtrer par statut:
      </label>
      <select
        id="status-filter"
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="bg-brand-dark-surface border border-brand-dark-border rounded-lg px-4 py-2 text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent hover:border-brand-accent/50 transition-colors min-h-[44px] min-w-[200px]"
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>
  );
}
