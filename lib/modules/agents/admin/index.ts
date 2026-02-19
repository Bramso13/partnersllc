import { createAdminClient } from "@/lib/supabase/server";
import { getAgentProgressSummary } from "@/lib/agent/dossiers";

interface Agent {
  id: string;
  name: string;
  email: string;
  agent_type: string;
  active: boolean;
}

interface AgentWithProgress {
  id: string;
  name: string;
  email: string;
  agent_type: string;
  progression: {
    steps_completed_by_agent: number;
    steps_total: number;
    documents_processed_by_agent: number;
    documents_total: number;
  };
}

export async function getAll(): Promise<Agent[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agents")
    .select("id, name, email, agent_type, active")
    .eq("active", true)
    .neq("agent_type", "ADMIN")
    .order("name", { ascending: true });

  if (error) {
    console.error("[getAllAgents] error", error);
    throw error;
  }

  return data as Agent[];
}

export async function getAllWithProgress(): Promise<AgentWithProgress[]> {
  const agents = await getAll();

  const agentsWithProgress = await Promise.all(
    agents.map(async (a) => {
      const progression = await getAgentProgressSummary(a.id);
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        agent_type: a.agent_type,
        progression,
      };
    })
  );

  return agentsWithProgress;
}

export async function getById(agentId: string): Promise<Agent | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agents")
    .select("id, name, email, agent_type, active")
    .eq("id", agentId)
    .single();

  if (error) {
    console.error("[getAgentById] error", error);
    return null;
  }

  return data as Agent;
}

export async function updateAgent(
  agentId: string,
  updates: Partial<{ name: string; email: string; agent_type: string; active: boolean }>
): Promise<Agent | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agents")
    .update(updates)
    .eq("id", agentId)
    .select("id, name, email, agent_type, active")
    .single();

  if (error) {
    console.error("[updateAgent] error", error);
    return null;
  }

  return data as Agent;
}
