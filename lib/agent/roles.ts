import { createAdminClient } from "@/lib/supabase/server";

export type AssignmentType = "VERIFICATEUR" | "CREATEUR";

/**
 * Retourne les types d'assignation (rôles) d'un agent sur un dossier.
 * Un agent peut avoir VERIFICATEUR, CREATEUR, ou les deux (double rôle).
 */
export async function getAgentAssignmentTypesOnDossier(
  agentId: string,
  dossierId: string
): Promise<AssignmentType[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dossier_agent_assignments")
    .select("assignment_type")
    .eq("dossier_id", dossierId)
    .eq("agent_id", agentId);

  if (error) {
    console.error("[getAgentAssignmentTypesOnDossier]", error);
    return [];
  }

  return (data || []).map(
    (row: { assignment_type: string }) => row.assignment_type as AssignmentType
  );
}

/**
 * Vérifie si l'agent peut agir en tant que vérificateur sur ce dossier (steps CLIENT).
 */
export async function agentCanActAsVerificateurOnDossier(
  agentId: string,
  dossierId: string
): Promise<boolean> {
  const roles = await getAgentAssignmentTypesOnDossier(agentId, dossierId);
  return roles.includes("VERIFICATEUR");
}

/**
 * Vérifie si l'agent peut agir en tant que créateur sur ce dossier (steps ADMIN).
 */
export async function agentCanActAsCreateurOnDossier(
  agentId: string,
  dossierId: string
): Promise<boolean> {
  const roles = await getAgentAssignmentTypesOnDossier(agentId, dossierId);
  return roles.includes("CREATEUR");
}
