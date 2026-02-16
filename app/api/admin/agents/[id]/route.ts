import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const AgentTypeSchema = z.enum([
  "VERIFICATEUR",
  "CREATEUR",
  "VERIFICATEUR_ET_CREATEUR",
]);

const PatchAgentSchema = z.object({
  agent_type: AgentTypeSchema.optional(),
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

/**
 * PATCH /api/admin/agents/[id]
 * Met à jour un agent (type, nom, actif) - Story 8.5 gestion type agent
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const agentId = z.string().uuid().parse(id);

    const body = await request.json();
    const data = PatchAgentSchema.parse(body);

    const supabase = createAdminClient();

    const updatePayload: Record<string, unknown> = {};
    if (data.agent_type !== undefined) updatePayload.agent_type = data.agent_type;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.active !== undefined) updatePayload.active = data.active;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    const { data: agent, error } = await supabase
      .from("agents")
      .update(updatePayload)
      .eq("id", agentId)
      .select("id, name, email, agent_type, active")
      .single();

    if (error) {
      console.error("[PATCH /api/admin/agents/[id]]", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de l'agent" },
        { status: 500 }
      );
    }

    if (!agent) {
      return NextResponse.json({ error: "Agent non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        agent_type: agent.agent_type,
        active: agent.active,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }
}
