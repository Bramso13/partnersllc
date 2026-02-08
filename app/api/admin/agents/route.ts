import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

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

    return NextResponse.json({
      agents: (data || []).map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        agent_type: a.agent_type,
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/agents] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
