import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export type { CreateDossierInput } from "@/lib/dossiers";

export interface AdvisorInfo {
  id: string | null;
  name: string;
  email: string;
  role: string;
}

export type CreateAdminStepInstancesResult = {
  created: number;
  step_instances: Array<{ id: string; step_id: string }>;
};

export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  return createAdminClient();
}
