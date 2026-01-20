import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
type ValidationStatus = typeof VALID_STATUSES[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; step_instance_id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { id: dossierId, step_instance_id } = await params;

    const body = await req.json();
    const { status } = body as { status: ValidationStatus };

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Update the step instance validation_status
    const updateData: Record<string, unknown> = {
      validation_status: status,
      // updated_at: new Date().toISOString(),
    };

    // If approved, also set completed_at
    if (status === "APPROVED") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: stepInstance, error: updateError } = await supabase
      .from("step_instances")
      .update(updateData)
      .eq("id", step_instance_id)
      .eq("dossier_id", dossierId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating step status:", updateError);
      return NextResponse.json(
        { error: "Failed to update step status" },
        { status: 500 }
      );
    }

    // Create event for audit trail
    await supabase.from("events").insert({
      entity_type: "dossier",
      entity_id: dossierId,
      event_type: "STEP_STATUS_CHANGED",
      actor_type: "AGENT",
      actor_id: admin.id,
      payload: {
        step_instance_id,
        new_status: status,
        changed_by: admin.id,
      },
    });

    return NextResponse.json({
      success: true,
      stepInstance,
    });
  } catch (error) {
    console.error("Error in update step status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
