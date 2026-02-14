import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
// Note: sendStepCompletedNotifications removed - notifications now handled
// by event-to-notification orchestration system (Story 3.9)

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/agent/steps/[id]/complete
 * Marque une step_instance comme completee
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: stepInstanceId } = await params;
    const user = await requireAgentAuth();
    const supabase = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { manual } = body as { manual?: boolean };

    // Get agent from email
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, agent_type, name")
      .eq("email", user.email)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent non trouve" },
        { status: 403 }
      );
    }

    // Get step instance with step info
    const { data: stepInstance, error: stepError } = await supabase
      .from("step_instances")
      .select(
        `
        id,
        assigned_to,
        completed_at,
        dossier_id,
        step_id,
        step:steps (
          id,
          code,
          label,
          step_type
        )
      `
      )
      .eq("id", stepInstanceId)
      .single();

    if (stepError || !stepInstance) {
      return NextResponse.json(
        { error: "Step non trouvee" },
        { status: 404 }
      );
    }

    // Verify assignment (or admin)
    if (user.role !== "ADMIN" && stepInstance.assigned_to !== agent.id) {
      return NextResponse.json(
        { error: "Vous n'etes pas assigne a cette step" },
        { status: 403 }
      );
    }

    // Verify step type compatibility with agent role
    const step = Array.isArray(stepInstance.step)
      ? stepInstance.step[0]
      : stepInstance.step;

    // VERIFICATEUR can only handle CLIENT steps
    if (agent.agent_type === "VERIFICATEUR" && step?.step_type !== "CLIENT") {
      return NextResponse.json(
        { error: "Type de step incompatible avec votre role VERIFICATEUR" },
        { status: 403 }
      );
    }

    // CREATEUR can only handle ADMIN steps
    if (agent.agent_type === "CREATEUR" && step?.step_type !== "ADMIN") {
      return NextResponse.json(
        { error: "Type de step incompatible avec votre role CREATEUR" },
        { status: 403 }
      );
    }

    // Check if already completed
    if (stepInstance.completed_at) {
      return NextResponse.json(
        { error: "Cette step est deja completee" },
        { status: 400 }
      );
    }

    // For CREATEUR agents, verify all required admin documents are delivered
    if (agent.agent_type === "CREATEUR") {
      // Get all required document types for this step (directly via step_id)
      const { data: requiredDocTypes } = await supabase
        .from("step_document_types")
        .select(`
          document_type_id,
          document_type:document_types(id)
        `)
        .eq("step_id", stepInstance.step_id);

      if (requiredDocTypes && requiredDocTypes.length > 0) {
        // Check that all required documents exist and are delivered
        for (const reqDoc of requiredDocTypes) {
          const { data: document } = await supabase
            .from("documents")
            .select("status, step_instance_id")
            .eq("dossier_id", stepInstance.dossier_id)
            .eq("document_type_id", reqDoc.document_type_id)
            .eq("step_instance_id", stepInstanceId)
            .single();

          if (!document || document.status !== "DELIVERED") {
            return NextResponse.json(
              { error: "Tous les documents requis doivent être uploadés et livrés avant de compléter l'étape" },
              { status: 400 }
            );
          }
        }
      }
    }

    // Update step_instance: set completed_at, and for CREATEUR also set APPROVED status
    const now = new Date().toISOString();
    const stepUpdateData: Record<string, string> = { completed_at: now };
    if (agent.agent_type === "CREATEUR") {
      stepUpdateData.validation_status = "APPROVED";
      stepUpdateData.validated_by = agent.id;
      stepUpdateData.validated_at = now;
    }

    const { error: updateError } = await supabase
      .from("step_instances")
      .update(stepUpdateData)
      .eq("id", stepInstanceId);

    if (updateError) {
      console.error("[POST /api/agent/steps/complete] Update error", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise a jour" },
        { status: 500 }
      );
    }

    // Create STEP_COMPLETED event
    // Note: Event-to-notification orchestration system will automatically
    // create and send notifications based on configured rules (Story 3.9)
    const { data: eventData } = await supabase
      .from("events")
      .insert({
        entity_type: "step_instance",
        entity_id: stepInstanceId,
        event_type: "STEP_COMPLETED",
        actor_type: "AGENT",
        actor_id: agent.id,
        payload: {
          manual: !!manual,
          agent_type: agent.agent_type,
          agent_name: agent.name || user.email,
          step_code: step?.code,
          step_label: step?.label,
          dossier_id: stepInstance.dossier_id,
        },
      })
      .select("id")
      .single();

    // Avancer le workflow du dossier - trouver la prochaine step
    const { data: dossier } = await supabase
      .from("dossiers")
      .select("id, product_id, current_step_instance_id, user_id")
      .eq("id", stepInstance.dossier_id)
      .single();

    if (dossier) {
      // Get current step position
      const { data: currentProductStep } = await supabase
        .from("product_steps")
        .select("position")
        .eq("product_id", dossier.product_id)
        .eq("step_id", stepInstance.step_id)
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

          let nextStepInstanceId: string;

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
          if (nextStepInstanceId!) {
            await supabase
              .from("dossiers")
              .update({ current_step_instance_id: nextStepInstanceId })
              .eq("id", dossier.id);
          }
        } else {
          // No more steps - workflow complete
          // Could update dossier status to COMPLETED here if needed
        }
      }

      // Get next step name for event payload
      let nextStepName: string | null = null;
      if (currentProductStep) {
        const { data: nextProductStep } = await supabase
          .from("product_steps")
          .select("step_id, step:steps(label)")
          .eq("product_id", dossier.product_id)
          .gt("position", currentProductStep.position)
          .order("position", { ascending: true })
          .limit(1)
          .single();

        if (nextProductStep) {
          const nextStep = Array.isArray(nextProductStep.step)
            ? nextProductStep.step[0]
            : nextProductStep.step;
          nextStepName = nextStep?.label || null;
        }
      }

      // Update event payload with next_step_name
      if (eventData?.id && nextStepName) {
        await supabase
          .from("events")
          .update({
            payload: {
              manual: !!manual,
              agent_type: agent.agent_type,
              agent_name: agent.name || user.email,
              step_code: step?.code,
              step_label: step?.label,
              step_name: step?.label,
              dossier_id: stepInstance.dossier_id,
              next_step_name: nextStepName,
            },
          })
          .eq("id", eventData.id);
      }

      // Note: Notification creation and delivery is now handled automatically
      // by the event-to-notification orchestration system (Story 3.9)
      // The STEP_COMPLETED event above will trigger notifications based on
      // configured rules in the notification_rules table
    }

    return NextResponse.json({
      success: true,
      message: "Step completee avec succes",
    });
  } catch (error) {
    console.error("[POST /api/agent/steps/complete] Error", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
