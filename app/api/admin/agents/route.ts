import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getAgentProgressSummary } from "@/lib/agent/dossiers";

export async function GET() {
  await requireAdminAuth();
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from("agents")
      .select("id, name, email, agent_type, active")
      .eq("active", true)
      .neq("agent_type", "ADMIN")
      .order("name", { ascending: true });

    if (error) {
      console.error("[GET /api/admin/agents] error", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des agents" },
        { status: 500 }
      );
    }

    console.log("data", data);

    const agentsWithProgress = await Promise.all(
      (data || []).map(async (a) => {
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

    console.log("agentsWithProgress", agentsWithProgress);

    return NextResponse.json({
      agents: agentsWithProgress,
    });
  } catch (error) {
    console.error("[GET /api/admin/agents] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
