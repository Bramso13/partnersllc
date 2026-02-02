/**
 * Dossier status types and constants - NO server dependencies.
 * Safe to import from Client Components.
 */

export type DossierStatus =
  | "QUALIFICATION"
  | "FORM_SUBMITTED"
  | "NM_PENDING"
  | "LLC_ACCEPTED"
  | "EIN_PENDING"
  | "BANK_PREPARATION"
  | "BANK_OPENED"
  | "WAITING_48H"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "CLOSED"
  | "ERROR";

/** All dossier status codes in display order. Use for dropdowns and validation. */
export const DOSSIER_STATUS_LIST: DossierStatus[] = [
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

/** Options for dossier status selector (value + label) */
export const DOSSIER_STATUS_OPTIONS: { value: DossierStatus; label: string }[] =
  [
    { value: "QUALIFICATION", label: "Qualification" },
    { value: "FORM_SUBMITTED", label: "Formulaire soumis" },
    { value: "NM_PENDING", label: "NM en attente" },
    { value: "LLC_ACCEPTED", label: "LLC acceptée" },
    { value: "EIN_PENDING", label: "EIN en attente" },
    { value: "BANK_PREPARATION", label: "Préparation bancaire" },
    { value: "BANK_OPENED", label: "Banque ouverte" },
    { value: "WAITING_48H", label: "Attente 48h" },
    { value: "IN_PROGRESS", label: "En cours" },
    { value: "UNDER_REVIEW", label: "En révision" },
    { value: "COMPLETED", label: "Terminé" },
    { value: "CLOSED", label: "Fermé" },
    { value: "ERROR", label: "Erreur" },
  ];

export function isValidDossierStatus(value: string): value is DossierStatus {
  return DOSSIER_STATUS_LIST.includes(value as DossierStatus);
}
