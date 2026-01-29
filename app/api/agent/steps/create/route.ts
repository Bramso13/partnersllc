import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/agent/steps/create
 * Crée une step_instance ADMIN sans la compléter (started_at = now, completed_at = null).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAgentAuth();
    const supabase = createAdminClient();
    const body = await request.json();
    const { dossier_id, step_id } = body as { dossier_id: string; step_id: string };

    if (!dossier_id || !step_id) {
      return NextResponse.json(
        { error: "dossier_id et step_id sont requis" },
        { status: 400 }
      );
    }

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, agent_type, name")
      .eq("email", user.email)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent non trouvé" }, { status: 403 });
    }

    if (agent.agent_type !== "CREATEUR") {
      return NextResponse.json(
        { error: "Seuls les agents CREATEUR peuvent créer des steps ADMIN" },
        { status: 403 }
      );
    }

    const { data: accessCheck } = await supabase
      .from("dossier_agent_assignments")
      .select("id")
      .eq("dossier_id", dossier_id)
      .eq("agent_id", agent.id)
      .limit(1)
      .maybeSingle();

    if (!accessCheck && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à ce dossier" },
        { status: 403 }
      );
    }

    const { data: step, error: stepError } = await supabase
      .from("steps")
      .select("id, code, label, step_type")
      .eq("id", step_id)
      .single();

    if (stepError || !step) {
      return NextResponse.json({ error: "Step non trouvée" }, { status: 404 });
    }

    if (step.step_type !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Seules les steps ADMIN peuvent être créées via cet endpoint",
        },
        { status: 400 }
      );
    }

    const { data: existingInstance } = await supabase
      .from("step_instances")
      .select("id")
      .eq("dossier_id", dossier_id)
      .eq("step_id", step_id)
      .maybeSingle();

    if (existingInstance) {
      return NextResponse.json({
        success: true,
        message: "Step déjà créée",
        step_instance_id: existingInstance.id,
      });
    }

    const now = new Date().toISOString();
    const { data: newInstance, error: createError } = await supabase
      .from("step_instances")
      .insert({
        dossier_id,
        step_id,
        assigned_to: agent.id,
        started_at: now,
        completed_at: null,
      })
      .select("id")
      .single();

    if (createError || !newInstance) {
      console.error("[POST /api/agent/steps/create] Create error", createError);
      return NextResponse.json(
        { error: "Erreur lors de la création de la step_instance" },
        { status: 500 }
      );
    }

    await supabase
      .from("dossiers")
      .update({ current_step_instance_id: newInstance.id })
      .eq("id", dossier_id);

    return NextResponse.json({
      success: true,
      message: "Step créée avec succès",
      step_instance_id: newInstance.id,
    });
  } catch (error) {
    console.error("[POST /api/agent/steps/create] Error", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
