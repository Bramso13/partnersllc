import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const agent = await requireAdminAuth();
    const { id: dossierId } = await params;

    // Parse request body
    const body = await request.json();
    const { stepInstanceId, agentId } = body;

    if (!stepInstanceId || !agentId) {
      return NextResponse.json(
        { error: "stepInstanceId and agentId are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get old assignment for audit trail
    const { data: oldStepInstance } = await supabase
      .from("step_instances")
      .select("assigned_to")
      .eq("id", stepInstanceId)
      .single();

    // Update step_instances.assigned_to
    const { data: stepInstance, error: updateError } = await supabase
      .from("step_instances")
      .update({
        assigned_to: agentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stepInstanceId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating step instance assignment:", updateError);
      return NextResponse.json(
        { error: "Failed to update assignment" },
        { status: 500 }
      );
    }

    // Create assignment change event
    const { error: eventError } = await supabase.from("events").insert({
      entity_type: "dossier",
      entity_id: dossierId,
      event_type: "STEP_STARTED", // Using closest available type, or could add custom event
      actor_type: "AGENT",
      actor_id: agent.id,
      payload: {
        action: "assignment_changed",
        step_instance_id: stepInstanceId,
        old_agent_id: oldStepInstance?.assigned_to || null,
        new_agent_id: agentId,
        changed_by_agent: agent.id,
      },
    });

    if (eventError) {
      console.error("Error creating assignment change event:", eventError);
    }

    // TODO: Send notification to new agent
    // This would require implementing a notification system

    return NextResponse.json({
      success: true,
      stepInstance,
    });
  } catch (error) {
    console.error("Error in agent assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
