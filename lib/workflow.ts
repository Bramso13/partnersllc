export type {
  StepType,
  Step,
  DocumentType,
  FormationSummary,
  ProductStep,
  ProductWithSteps,
  StepInstanceWithStep,
} from "@/lib/modules/workflow/shared";

import * as client from "@/lib/modules/workflow/client";

export async function getProductSteps(productId: string) {
  return client.getProductSteps(productId);
}

export async function getStepFields(stepId: string) {
  return client.getStepFields(stepId);
}

export async function getCurrentStepInstance(dossierId: string) {
  return client.getCurrentStepInstance(dossierId);
}
