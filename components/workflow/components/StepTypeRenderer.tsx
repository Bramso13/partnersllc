import { AdminStepView } from "./AdminStepView";
import { FormationStepView } from "./FormationStepView";
import { ClientStepForm } from "./ClientStepForm";
import { ClientStepReadOnly } from "./ClientStepReadOnly";
import type { StepTypeRendererProps } from "../types";

/**
 * StepTypeRenderer Component
 *
 * Orchestrates which view to display based on step type and edit permissions:
 * - ADMIN steps → AdminStepView (read-only for client)
 * - FORMATION steps → FormationStepView (with formation content + completion button)
 * - CLIENT steps (editable) → ClientStepForm (DRAFT or REJECTED status)
 * - CLIENT steps (read-only) → ClientStepReadOnly (SUBMITTED/UNDER_REVIEW/APPROVED)
 */
export function StepTypeRenderer({
  stepType,
  isEditable,
  // AdminStepView props
  adminStepViewProps,
  // FormationStepView props
  formationStepViewProps,
  // ClientStepForm props
  clientStepFormProps,
  // ClientStepReadOnly props
  clientStepReadOnlyProps,
}: StepTypeRendererProps) {
  // Admin step
  if (stepType === "admin" && adminStepViewProps) {
    return <AdminStepView {...adminStepViewProps} />;
  }

  // Formation step
  if (stepType === "formation" && formationStepViewProps) {
    return <FormationStepView {...formationStepViewProps} />;
  }

  // Client step - editable (DRAFT or REJECTED)
  if (stepType === "client" && isEditable && clientStepFormProps) {
    return <ClientStepForm {...clientStepFormProps} />;
  }

  // Client step - read-only (SUBMITTED/UNDER_REVIEW/APPROVED)
  if (stepType === "client" && !isEditable && clientStepReadOnlyProps) {
    return <ClientStepReadOnly {...clientStepReadOnlyProps} />;
  }

  return null;
}
