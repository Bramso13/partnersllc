import { createClient } from "@/lib/supabase/server";
import type { StepInstanceWithStep, Step } from "../shared";

export async function getCurrentStepInstance(dossierId: string): Promise<StepInstanceWithStep | null> {
  const supabase = await createClient();

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("current_step_instance_id")
    .eq("id", dossierId)
    .single();

  if (!dossier?.current_step_instance_id) {
    return null;
  }

  const { data: stepInstance, error } = await supabase
    .from("step_instances")
    .select(
      `
      id,
      dossier_id,
      step_id,
      started_at,
      completed_at,
      step:steps (
        id,
        code,
        label,
        description,
        position,
        step_type
      )
    `
    )
    .eq("id", dossier.current_step_instance_id)
    .single();

  if (error) {
    console.error("Error fetching step instance:", error);
    return null;
  }

  return {
    ...stepInstance,
    step: (Array.isArray(stepInstance.step)
      ? stepInstance.step[0]
      : stepInstance.step) as Step,
  };
}
