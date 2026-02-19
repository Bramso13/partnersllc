import { createClient } from "@/lib/supabase/server";
import type { DossierWithDetails } from "@/types/dossiers";
import { enrichDossierWithDetails } from "../shared";

export async function getAll(): Promise<DossierWithDetails[]> {
  const supabase = await createClient();

  const { data: dossiers, error: dossiersError } = await supabase
    .from("dossiers")
    .select("*")
    .order("created_at", { ascending: false });

  if (dossiersError) {
    console.error("Error fetching dossiers:", dossiersError);
    throw dossiersError;
  }

  if (!dossiers || dossiers.length === 0) {
    return [];
  }

  const dossiersWithDetails = await Promise.all(
    dossiers.map(async (dossier) => {
      const enriched = await enrichDossierWithDetails(supabase, dossier);
      return enriched as unknown as DossierWithDetails;
    })
  );

  return dossiersWithDetails;
}
