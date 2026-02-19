import { createAdminClient } from "@/lib/supabase/server";
import type { CreateAdminStepInstancesResult } from "../shared";

export async function createAdminStepInstances(
  dossierId: string
): Promise<CreateAdminStepInstancesResult> {
  const supabase = createAdminClient();

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("id, product_id")
    .eq("id", dossierId)
    .single();

  if (dossierError || !dossier) {
    throw new Error(
      `Dossier non trouvé: ${dossierError?.message || "inconnu"}`
    );
  }

  if (!dossier.product_id) {
    return { created: 0, step_instances: [] };
  }

  const { data: productSteps, error: stepsError } = await supabase
    .from("product_steps")
    .select("step_id, position, steps!inner(id, step_type)")
    .eq("product_id", dossier.product_id)
    .order("position", { ascending: true });

  if (stepsError) {
    throw new Error(
      `Erreur lors de la récupération des steps produit: ${stepsError.message}`
    );
  }

  const adminSteps = (productSteps || []).filter((ps) => {
    const step = Array.isArray(ps.steps) ? ps.steps[0] : ps.steps;
    return (step as { step_type?: string } | null)?.step_type === "ADMIN";
  });

  if (adminSteps.length === 0) {
    return { created: 0, step_instances: [] };
  }

  const { data: existingInstances } = await supabase
    .from("step_instances")
    .select("step_id")
    .eq("dossier_id", dossierId);

  const existingStepIds = new Set(
    (existingInstances || []).map((si) => si.step_id)
  );

  const toCreate = adminSteps.filter((ps) => !existingStepIds.has(ps.step_id));
  if (toCreate.length === 0) {
    return { created: 0, step_instances: [] };
  }

  const insertData = toCreate.map((ps) => ({
    dossier_id: dossierId,
    step_id: ps.step_id,
    started_at: null,
  }));

  const { data: created, error: insertError } = await supabase
    .from("step_instances")
    .insert(insertData)
    .select("id, step_id");

  if (insertError) {
    throw new Error(
      `Erreur lors de la création des step_instances: ${insertError.message}`
    );
  }

  return {
    created: created?.length ?? 0,
    step_instances: created ?? [],
  };
}
