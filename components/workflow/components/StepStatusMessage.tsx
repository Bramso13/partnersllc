import type { StepStatusMessageProps } from "../types";

/**
 * StepStatusMessage Component
 *
 * Displays validation status messages for client steps:
 * - SUBMITTED/UNDER_REVIEW: Info message (verification in progress)
 * - APPROVED: Success message
 * - REJECTED: Error message (corrections needed)
 *
 * Admin steps don't show this message.
 */
export function StepStatusMessage({
  validationStatus,
  isAdminStep,
}: StepStatusMessageProps) {
  // Don't show message for admin steps
  if (isAdminStep) return null;

  if (!validationStatus || validationStatus === "DRAFT") return null;

  let messageConfig:
    | { type: "info" | "success" | "error"; icon: string; text: string }
    | null = null;

  switch (validationStatus) {
    case "SUBMITTED":
    case "UNDER_REVIEW":
      messageConfig = {
        type: "info",
        icon: "⏳",
        text: "Votre soumission est en cours de vérification par notre équipe",
      };
      break;
    case "APPROVED":
      messageConfig = {
        type: "success",
        icon: "✓",
        text: "Étape validée avec succès",
      };
      break;
    case "REJECTED":
      messageConfig = {
        type: "error",
        icon: "⚠️",
        text: "Des corrections sont nécessaires. Veuillez modifier les champs indiqués ci-dessous.",
      };
      break;
    default:
      return null;
  }

  if (!messageConfig) return null;

  return (
    <div
      className={`p-4 rounded-lg mb-6 ${
        messageConfig.type === "error"
          ? "bg-brand-danger/10 border border-brand-danger"
          : messageConfig.type === "success"
            ? "bg-brand-success/10 border border-brand-success"
            : "bg-brand-warning/10 border border-brand-warning"
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{messageConfig.icon}</span>
        <span className="text-sm">{messageConfig.text}</span>
      </div>
    </div>
  );
}
