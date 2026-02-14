import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendStepCompletedNotifications } from "@/lib/notifications/step-notifications";

/**
 * POST /api/agent/steps/create-and-complete
 * Crée une step_instance ADMIN et la complète immédiatement
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

    // Get agent from email
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, agent_type, name")
      .eq("email", user.email)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent non trouvé" },
        { status: 403 }
      );
    }

    // Verify agent is CREATEUR
    if (agent.agent_type !== "CREATEUR") {
      return NextResponse.json(
        { error: "Seuls les agents CREATEUR peuvent créer et compléter des steps ADMIN" },
        { status: 403 }
      );
    }

    // Verify dossier access (agent must be assigned to this dossier)
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

    // Get step info
    const { data: step, error: stepError } = await supabase
      .from("steps")
      .select("id, code, label, step_type")
      .eq("id", step_id)
      .single();

    if (stepError || !step) {
      return NextResponse.json(
        { error: "Step non trouvée" },
        { status: 404 }
      );
    }

    // Verify it's an ADMIN step
    if (step.step_type !== "ADMIN") {
      return NextResponse.json(
        { error: "Seules les steps ADMIN peuvent être créées et complétées via cet endpoint" },
        { status: 400 }
      );
    }

    // Check if step_instance already exists
    const { data: existingInstance } = await supabase
      .from("step_instances")
      .select("id, completed_at")
      .eq("dossier_id", dossier_id)
      .eq("step_id", step_id)
      .single();

    if (existingInstance) {
      if (existingInstance.completed_at) {
        return NextResponse.json(
          { error: "Cette step est déjà complétée" },
          { status: 400 }
        );
      }
      // If exists but not completed, complete it
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("step_instances")
        .update({
          completed_at: now,
          assigned_to: agent.id,
          validation_status: "APPROVED",
          validated_by: agent.id,
          validated_at: now,
        })
        .eq("id", existingInstance.id);

      if (updateError) {
        console.error("[POST /api/agent/steps/create-and-complete] Update error", updateError);
        return NextResponse.json(
          { error: "Erreur lors de la mise à jour" },
          { status: 500 }
        );
      }

      // Create event and notifications (same as complete endpoint)
      await createCompletionEvent(supabase, existingInstance.id, step, dossier_id, agent);
      await advanceWorkflow(supabase, dossier_id, step_id);

      return NextResponse.json({
        success: true,
        message: "Step complétée avec succès",
        step_instance_id: existingInstance.id,
      });
    }

    // Create new step_instance with completed_at set and APPROVED status (CREATEUR)
    const now = new Date().toISOString();
    const { data: newInstance, error: createError } = await supabase
      .from("step_instances")
      .insert({
        dossier_id,
        step_id,
        assigned_to: agent.id,
        started_at: now,
        completed_at: now,
        validation_status: "APPROVED",
        validated_by: agent.id,
        validated_at: now,
      })
      .select("id")
      .single();

    if (createError || !newInstance) {
      console.error("[POST /api/agent/steps/create-and-complete] Create error", createError);
      return NextResponse.json(
        { error: "Erreur lors de la création de la step_instance" },
        { status: 500 }
      );
    }

    // Create event and notifications
    await createCompletionEvent(supabase, newInstance.id, step, dossier_id, agent);
    await advanceWorkflow(supabase, dossier_id, step_id);

    return NextResponse.json({
      success: true,
      message: "Step créée et complétée avec succès",
      step_instance_id: newInstance.id,
    });
  } catch (error) {
    console.error("[POST /api/agent/steps/create-and-complete] Error", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

async function createCompletionEvent(
  supabase: ReturnType<typeof createAdminClient>,
  stepInstanceId: string,
  step: { code: string; label: string | null },
  dossierId: string,
  agent: { id: string; agent_type: string; name: string | null }
) {
  // Get dossier user_id for notifications
  const { data: dossier } = await supabase
    .from("dossiers")
    .select("user_id")
    .eq("id", dossierId)
    .single();

  // Create STEP_COMPLETED event
  const { data: eventData } = await supabase
    .from("events")
    .insert({
      entity_type: "step_instance",
      entity_id: stepInstanceId,
      event_type: "STEP_COMPLETED",
      actor_type: "AGENT",
      actor_id: agent.id,
      payload: {
        manual: false,
        agent_type: agent.agent_type,
        agent_name: agent.name || null,
        step_code: step.code,
        step_label: step.label,
        dossier_id: dossierId,
      },
    })
    .select("id")
    .single();

  // Create notification
  if (dossier && eventData) {
    const { data: notification } = await supabase
      .from("notifications")
      .insert({
        user_id: dossier.user_id,
        dossier_id: dossierId,
        event_id: eventData.id,
        title: "Étape terminée",
        message: `L'étape "${step.label}" a été terminée avec succès.`,
        template_code: "STEP_COMPLETED",
        payload: {
          step_name: step.label,
          step_code: step.code,
          dossier_id: dossierId,
        },
        action_url: `/dashboard/dossiers/${dossierId}`,
      })
      .select("id")
      .single();

    // Send notifications in background
    if (notification) {
      sendStepCompletedNotifications(
        notification.id,
        dossierId,
        dossier.user_id
      ).catch((error) => {
        console.error(
          "[POST /api/agent/steps/create-and-complete] Error sending notifications:",
          error
        );
      });
    }
  }
}

async function advanceWorkflow(
  supabase: ReturnType<typeof createAdminClient>,
  dossierId: string,
  completedStepId: string
) {
  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id, product_id, current_step_instance_id")
    .eq("id", dossierId)
    .single();

  if (!dossier) return;

  // Get current step position
  const { data: currentProductStep } = await supabase
    .from("product_steps")
    .select("position")
    .eq("product_id", dossier.product_id)
    .eq("step_id", completedStepId)
    .single();

  if (currentProductStep) {
    // Get next step
    const { data: nextProductStep } = await supabase
      .from("product_steps")
      .select("step_id")
      .eq("product_id", dossier.product_id)
      .gt("position", currentProductStep.position)
      .order("position", { ascending: true })
      .limit(1)
      .single();

    if (nextProductStep) {
      // Check if step_instance already exists for next step
      const { data: existingNextStep } = await supabase
        .from("step_instances")
        .select("id")
        .eq("dossier_id", dossier.id)
        .eq("step_id", nextProductStep.step_id)
        .single();

      let nextStepInstanceId: string | undefined;

      if (existingNextStep) {
        nextStepInstanceId = existingNextStep.id;
      } else {
        // Create next step_instance (auto-assignment will trigger via DB trigger)
        const { data: newStepInstance } = await supabase
          .from("step_instances")
          .insert({
            dossier_id: dossier.id,
            step_id: nextProductStep.step_id,
          })
          .select("id")
          .single();

        if (newStepInstance) {
          nextStepInstanceId = newStepInstance.id;
        }
      }

      // Update dossier current_step_instance_id
      if (nextStepInstanceId) {
        await supabase
          .from("dossiers")
          .update({ current_step_instance_id: nextStepInstanceId })
          .eq("id", dossier.id);
      }
    }
  }
}
