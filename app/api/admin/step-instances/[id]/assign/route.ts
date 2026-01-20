import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdminAuth();
  const { id } = await params;
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const agentId: string | null = body.agentId ?? null;

    // Récupérer la step_instance avec sa step_type
    const { data: stepInstance, error: stepError } = await supabase
      .from("step_instances")
      .select(
        `
        id,
        step_id,
        assigned_to,
        steps!inner (
          step_type
        )
      `
      )
      .eq("id", id)
      .single();

    if (stepError || !stepInstance) {
      console.error("[PATCH /api/admin/step-instances/[id]/assign] step error", stepError);
      return NextResponse.json(
        { error: "Step instance introuvable" },
        { status: 404 }
      );
    }

    const step = Array.isArray(stepInstance.steps)
      ? stepInstance.steps[0]
      : stepInstance.steps;

    if (!step) {
      return NextResponse.json(
        { error: "Step introuvable pour cette instance" },
        { status: 400 }
      );
    }

    if (agentId) {
      // Vérifier que l'agent existe et a le bon type
      const expectedAgentType =
        step.step_type === "CLIENT" ? "VERIFICATEUR" : "CREATEUR";

      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("id, agent_type, active")
        .eq("id", agentId)
        .eq("active", true)
        .eq("agent_type", expectedAgentType)
        .single();

      if (agentError || !agent) {
        return NextResponse.json(
          { error: "Agent invalide pour ce type de step" },
          { status: 400 }
        );
      }
    }

    const { error: updateError } = await supabase
      .from("step_instances")
      .update({
        assigned_to: agentId,
      })
      .eq("id", id);

    if (updateError) {
      console.error(
        "[PATCH /api/admin/step-instances/[id]/assign] update error",
        updateError
      );
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de l'assignation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/step-instances/[id]/assign] error", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

