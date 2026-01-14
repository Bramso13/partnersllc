import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const agent = await requireAdminAuth();
    const { id: dossierId } = await params;

    // Parse request body
    const body = await request.json();
    const { stepInstanceId } = body;

    if (!stepInstanceId) {
      return NextResponse.json(
        { error: "stepInstanceId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update step_instances.completed_at (manual completion)
    const { data: stepInstance, error: updateError } = await supabase
      .from("step_instances")
      .update({
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", stepInstanceId)
      .select()
      .single();

    if (updateError) {
      console.error("Error completing step:", updateError);
      return NextResponse.json(
        { error: "Failed to complete step" },
        { status: 500 }
      );
    }

    // Create STEP_COMPLETED event with manual flag
    const { error: eventError } = await supabase.from("events").insert({
      entity_type: "dossier",
      entity_id: dossierId,
      event_type: "STEP_COMPLETED",
      actor_type: "AGENT",
      actor_id: agent.id,
      payload: {
        step_instance_id: stepInstanceId,
        manual: true,
        completed_by_agent: agent.id,
        note: "Manually completed by agent (bypassing automatic validation)",
      },
    });

    if (eventError) {
      console.error("Error creating step completion event:", eventError);
    }

    return NextResponse.json({
      success: true,
      stepInstance,
    });
  } catch (error) {
    console.error("Error in complete step:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
