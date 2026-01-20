import { createAdminClient } from "@/lib/supabase/server";

/**
 * Helpers pour tester l'assignation auto et la queue agent.
 * Ces tests sont conçus pour être utilisés manuellement sur une base de données de test.
 */

async function createTestAgent(agentType: "VERIFICATEUR" | "CREATEUR") {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .insert({
      email: `test+${agentType.toLowerCase()}@partnersllc.test`,
      name: `Test ${agentType}`,
      agent_type: agentType,
      active: true,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating test agent", error);
    throw error;
  }

  return data;
}

export async function testAutoAssignmentForStepType(
  stepType: "CLIENT" | "ADMIN",
  dossierId: string,
  stepId: string
): Promise<boolean> {
  console.log(`🧪 Test auto-assignation pour step_type=${stepType}`);
  const supabase = createAdminClient();

  // Créer 2 agents du bon type pour tester le load balancing
  const agentType = stepType === "CLIENT" ? "VERIFICATEUR" : "CREATEUR";
  const agent1 = await createTestAgent(agentType);
  const agent2 = await createTestAgent(agentType);

  // Créer deux step_instances pour ce dossier / step
  const { data: si1, error: siError1 } = await supabase
    .from("step_instances")
    .insert({
      dossier_id: dossierId,
      step_id: stepId,
    })
    .select("*")
    .single();

  if (siError1 || !si1) {
    console.error("❌ Erreur création step_instance 1", siError1);
    return false;
  }

  const { data: si2, error: siError2 } = await supabase
    .from("step_instances")
    .insert({
      dossier_id: dossierId,
      step_id: stepId,
    })
    .select("*")
    .single();

  if (siError2 || !si2) {
    console.error("❌ Erreur création step_instance 2", siError2);
    return false;
  }

  // Recharger les instances avec assigned_to
  const { data: instances, error: loadError } = await supabase
    .from("step_instances")
    .select("id, assigned_to")
    .in("id", [si1.id, si2.id]);

  if (loadError || !instances) {
    console.error("❌ Erreur lecture step_instances", loadError);
    return false;
  }

  console.log("📌 Instances assignées:", instances);

  const assignedAgents = instances.map((i) => i.assigned_to).filter(Boolean);

  if (assignedAgents.length === 0) {
    console.error("❌ Aucune instance assignée, trigger non exécuté ?");
    return false;
  }

  console.log("✅ Auto-assignation exécutée");
  return true;
}

