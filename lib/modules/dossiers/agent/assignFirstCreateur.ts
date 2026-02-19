import type { SupabaseClient } from "@supabase/supabase-js";

export async function assignFirstCreateur(
  supabase: SupabaseClient,
  dossierId: string
): Promise<void> {
  const { data: createurAgent } = await supabase
    .from("agents")
    .select("id, agent_type")
    .in("agent_type", ["CREATEUR", "VERIFICATEUR_ET_CREATEUR"])
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!createurAgent) return;

  if (createurAgent.agent_type === "CREATEUR") {
    await supabase.from("dossier_agent_assignments").insert({
      dossier_id: dossierId,
      agent_id: createurAgent.id,
      assignment_type: "CREATEUR",
    });
  } else if (createurAgent.agent_type === "VERIFICATEUR_ET_CREATEUR") {
    await supabase.from("dossier_agent_assignments").insert({
      dossier_id: dossierId,
      agent_id: createurAgent.id,
      assignment_type: "VERIFICATEUR",
    });
    await supabase.from("dossier_agent_assignments").insert({
      dossier_id: dossierId,
      agent_id: createurAgent.id,
      assignment_type: "CREATEUR",
    });
  }
}
