import { createAdminClient } from "@/lib/supabase/server";

interface StepInstanceStep {
  id: string;
  label: string;
  step_type: string;
}

interface StepInstance {
  id: string;
  step_id: string;
  dossier_id: string;
  started_at: string | null;
  completed_at: string | null;
  validation_status: string | null;
  step: StepInstanceStep | StepInstanceStep[];
}

interface EnrichedStepInstance {
  id: string;
  step_id: string;
  dossier_id: string;
  started_at: string | null;
  completed_at: string | null;
  validation_status: string;
  step: StepInstanceStep;
}

export async function getByDossierId(dossierId: string): Promise<EnrichedStepInstance[]> {
  const supabase = createAdminClient();

  const { data: stepInstances, error } = await supabase
    .from("step_instances")
    .select(
      `
      id,
      step_id,
      dossier_id,
      started_at,
      completed_at,
      validation_status,
      step:steps(id, label, step_type)
    `
    )
    .eq("dossier_id", dossierId)
    .order("started_at", { ascending: true });

  if (error) {
    console.error("[getStepInstancesByDossierId] Error:", error);
    throw error;
  }

  const steps = (stepInstances || []).map((si: StepInstance) => ({
    id: si.id,
    step_id: si.step_id,
    dossier_id: si.dossier_id,
    started_at: si.started_at,
    completed_at: si.completed_at,
    validation_status: si.validation_status ?? "PENDING",
    step: Array.isArray(si.step) ? si.step[0] : si.step,
  }));

  return steps as EnrichedStepInstance[];
}
