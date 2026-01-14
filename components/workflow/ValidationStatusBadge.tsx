"use client";

interface ValidationStatusBadgeProps {
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

export function ValidationStatusBadge({
  status,
  rejectionReason,
}: ValidationStatusBadgeProps) {
  const config = {
    PENDING: {
      icon: "⏳",
      label: "En attente",
      color: "bg-brand-warning/10 text-brand-warning border-brand-warning",
    },
    APPROVED: {
      icon: "✓",
      label: "Validé",
      color: "bg-brand-success/10 text-brand-success border-brand-success",
    },
    REJECTED: {
      icon: "✗",
      label: "Refusé",
      color: "bg-brand-danger/10 text-brand-danger border-brand-danger",
    },
  };

  const { icon, label, color } = config[status];
  const tooltipText = rejectionReason || label;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${color}`}
      title={tooltipText}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
