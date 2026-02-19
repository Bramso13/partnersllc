import { createClient } from "@/lib/supabase/server";
import type { Formation, FormationWithElements, StepFormationCustom, StepFormationCustomSummary } from "@/types/formations";

export async function getAccessibleFormations(userId: string): Promise<Formation[]> {
  const supabase = await createClient();

  const { data: formations, error: formationsError } = await supabase
    .from("formations")
    .select("*")
    .order("display_order", { ascending: true });

  if (formationsError) throw new Error("Failed to fetch formations");
  if (!formations || formations.length === 0) return [];

  const { data: userDossiers } = await supabase
    .from("dossiers")
    .select("product_id, type")
    .eq("user_id", userId);

  const userProductIds = new Set(userDossiers?.map((d) => d.product_id) || []);
  const userDossierTypes = new Set(userDossiers?.map((d) => d.type) || []);

  return formations.filter((f) => isFormationAccessibleToUser(f, userProductIds, userDossierTypes));
}

export function isFormationAccessibleToUser(formation: Formation, userProductIds: Set<string>, userDossierTypes: Set<string>): boolean {
  const { visibility_type, visibility_config } = formation;

  switch (visibility_type) {
    case "all": return true;
    case "by_product_ids": {
      const config = visibility_config as { product_ids?: string[] };
      return (config.product_ids || []).some((id) => userProductIds.has(id));
    }
    case "by_dossier_type": {
      const config = visibility_config as { dossier_type?: string };
      return config.dossier_type ? userDossierTypes.has(config.dossier_type) : false;
    }
    default: return false;
  }
}

export async function getFormationWithElements(formationId: string, checkAccess = false, userId?: string): Promise<FormationWithElements | null> {
  const supabase = await createClient();

  const { data: formation, error: formationError } = await supabase
    .from("formations")
    .select("*")
    .eq("id", formationId)
    .single();

  if (formationError || !formation) return null;

  if (checkAccess && userId) {
    const { data: userDossiers } = await supabase.from("dossiers").select("product_id, type").eq("user_id", userId);
    const userProductIds = new Set(userDossiers?.map((d) => d.product_id) || []);
    const userDossierTypes = new Set(userDossiers?.map((d) => d.type) || []);
    if (!isFormationAccessibleToUser(formation, userProductIds, userDossierTypes)) return null;
  }

  const { data: elements, error: elementsError } = await supabase
    .from("formation_elements")
    .select("*")
    .eq("formation_id", formationId)
    .order("position", { ascending: true });

  if (elementsError) throw new Error("Failed to fetch formation elements");

  return { ...formation, elements: elements || [] };
}

export async function getFormationsByStepForUser(stepId: string, userId: string): Promise<Formation[]> {
  const supabase = await createClient();

  const { data: links } = await supabase.from("step_formations").select("formation_id").eq("step_id", stepId).order("position", { ascending: true });
  if (!links || links.length === 0) return [];

  const { data: formations } = await supabase.from("formations").select("*").in("id", links.map((l) => l.formation_id)).order("display_order", { ascending: true });
  if (!formations || formations.length === 0) return [];

  const { data: userDossiers } = await supabase.from("dossiers").select("product_id, type").eq("user_id", userId);
  const userProductIds = new Set(userDossiers?.map((d) => d.product_id) || []);
  const userDossierTypes = new Set(userDossiers?.map((d) => d.type) || []);

  return formations.filter((f) => isFormationAccessibleToUser(f, userProductIds, userDossierTypes));
}

export async function getStepFormationsCustom(stepId: string): Promise<StepFormationCustomSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("step_formation_custom").select("id, step_id, position, title").eq("step_id", stepId).order("position", { ascending: true });
  if (error) throw new Error("Failed to fetch step custom formations");
  return (data ?? []) as StepFormationCustomSummary[];
}

export async function getStepFormationCustomForUser(customId: string, userId: string): Promise<StepFormationCustom | null> {
  const supabase = await createClient();

  const { data: custom } = await supabase.from("step_formation_custom").select("id, step_id, position, title, html_content").eq("id", customId).single();
  if (!custom) return null;

  const { data: dossiers } = await supabase.from("dossiers").select("product_id").eq("user_id", userId);
  const { data: productSteps } = await supabase.from("product_steps").select("step_id").in("product_id", dossiers?.map((d) => d.product_id) || []);

  const hasAccess = (productSteps || []).some((ps) => ps.step_id === custom.step_id);
  return hasAccess ? custom as StepFormationCustom : null;
}

export async function getUserProgress(userId: string, formationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_formation_progress").select("*").eq("user_id", userId).eq("formation_id", formationId).maybeSingle();
  if (error) throw new Error("Failed to fetch user progress");
  return data;
}

export async function updateUserProgress(userId: string, formationId: string, lastElementId: string | null | undefined, completedElementIds: string[] | undefined) {
  const supabase = await createClient();
  const lastElementIdValue = lastElementId ?? null;
  const completedElementIdsValue = completedElementIds ?? [];
  const { data: existing } = await supabase.from("user_formation_progress").select("*").eq("user_id", userId).eq("formation_id", formationId).maybeSingle();

  if (existing) {
    const { error } = await supabase.from("user_formation_progress").update({ last_element_id: lastElementIdValue, completed_element_ids: completedElementIdsValue, updated_at: new Date().toISOString() }).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("user_formation_progress").insert({ user_id: userId, formation_id: formationId, last_element_id: lastElementIdValue, completed_element_ids: completedElementIdsValue });
    if (error) throw error;
  }
}
