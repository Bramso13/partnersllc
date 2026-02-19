import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dossier } from "@/types/dossiers";
import { assignFirstCreateur } from "./assignFirstCreateur";
import { createAdminStepInstances } from "./createAdminStepInstances";

export type CreateDossierInput = {
  user_id: string;
  product_id: string;
  type: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

export async function create(
  supabase: SupabaseClient,
  input: CreateDossierInput
): Promise<{ data: Dossier | null; error: Error | null }> {
  console.log("🔍 [createDossier] input:", input);

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .insert({
      user_id: input.user_id,
      product_id: input.product_id,
      type: input.type,
      status: input.status ?? "QUALIFICATION",
      metadata: input.metadata ?? null,
    })
    .select()
    .single();

  console.log("🔍 [createDossier] dossier:", dossier);
  console.log("🔍 [createDossier] dossierError:", dossierError);

  if (dossierError || !dossier) {
    return {
      data: null,
      error: dossierError ?? new Error("Dossier creation failed"),
    };
  }

  console.log("🔍 [createDossier] Creating admin step instances for dossier...");
  await createAdminStepInstances(dossier.id);

  console.log("🔍 [createDossier] Assigning first createur to dossier...");
  await assignFirstCreateur(supabase, dossier.id);

  return { data: dossier as Dossier, error: null };
}
