import { createClient, createAdminClient } from "@/lib/supabase/server";

interface StepInstance {
  id: string;
  validation_status: string | null;
  rejection_reason: string | null;
  completed_at: string | null;
  started_at: string | null;
}

export async function getOrCreateStepInstance(
  userId: string,
  dossierId: string,
  stepId: string
): Promise<StepInstance | null> {
  const supabase = await createClient();

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("id, user_id")
    .eq("id", dossierId)
    .eq("user_id", userId)
    .single();

  if (dossierError || !dossier) {
    return null;
  }

  const { data: stepInstance, error } = await supabase
    .from("step_instances")
    .select("id, validation_status, rejection_reason, completed_at, started_at")
    .eq("dossier_id", dossierId)
    .eq("step_id", stepId)
    .single();

  if (error || !stepInstance) {
    const { data: newInstance, error: createError } = await supabase
      .from("step_instances")
      .insert({
        dossier_id: dossierId,
        step_id: stepId,
        started_at: new Date().toISOString(),
        validation_status: "DRAFT",
      })
      .select("id, validation_status, rejection_reason, completed_at, started_at")
      .single();

    if (createError || !newInstance) {
      console.error("Error creating step instance:", createError);
      return null;
    }

    return newInstance as StepInstance;
  }

  return stepInstance as StepInstance;
}
