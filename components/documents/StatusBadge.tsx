import type { DocumentStatus } from "@/lib/documents-types";

interface StatusBadgeProps {
  status: DocumentStatus;
}

const STATUS_STYLES: Record<DocumentStatus, string> = {
  PENDING: "text-brand-warning bg-brand-warning/10",
  APPROVED: "text-brand-success bg-brand-success/10",
  REJECTED: "text-brand-danger bg-brand-danger/10",
  OUTDATED: "text-brand-text-secondary bg-brand-dark-surface",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: "En attente de validation",
  APPROVED: "Validé",
  REJECTED: "Rejeté",
  OUTDATED: "Obsolète",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
