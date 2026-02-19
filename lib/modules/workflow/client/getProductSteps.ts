import { createClient } from "@/lib/supabase/server";
import type { ProductStep, Step } from "../shared";
import { fetchDocumentTypesForStep, mapStepToFormation, mapProductStep } from "../shared";

export async function getProductSteps(productId: string): Promise<ProductStep[]> {
  const supabase = await createClient();

  console.log(`[getProductSteps] Fetching product steps for product_id: ${productId}`);

  const { data: productSteps, error } = await supabase
    .from("product_steps")
    .select(
      `
      id,
      product_id,
      step_id,
      position,
      is_required,
      estimated_duration_hours,
      dossier_status_on_approval,
      step:steps (
        id,
        code,
        label,
        description,
        position,
        step_type,
        formation_id,
        timer_delay_minutes,
        formation:formations!steps_formation_id_fkey(id, titre)
      )
    `
    )
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[getProductSteps] Error fetching product steps:", error);
    throw error;
  }

  const stepsWithDocuments = await Promise.all(
    (productSteps || []).map(async (ps) => {
      const step = (Array.isArray(ps.step) ? ps.step[0] : ps.step) as Step;

      const documentTypes = await fetchDocumentTypesForStep(supabase, step.id);

      const stepWithFormation = step as Step & { formation?: unknown };
      const formationSummary = mapStepToFormation(stepWithFormation);

      return mapProductStep(ps as unknown as Record<string, unknown>, step, documentTypes, formationSummary);
    })
  );

  return stepsWithDocuments;
}
