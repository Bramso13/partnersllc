import { createAdminClient } from "@/lib/supabase/server";
import type { DossierWithDetails } from "@/types/dossiers";
import { enrichDossierWithDetails } from "../shared";

export async function getById(dossierId: string): Promise<DossierWithDetails | null> {
  const supabase = createAdminClient();

  const { data: dossier, error } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", dossierId)
    .single();

  if (error) {
    console.error("Error fetching dossier:", error);
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  if (!dossier) {
    return null;
  }

  const enriched = await enrichDossierWithDetails(supabase, dossier);
  return enriched as unknown as DossierWithDetails;
}
