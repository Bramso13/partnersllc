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
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Update dossier status
    const supabase = await createClient();
    const { data: dossier, error: updateError } = await supabase
      .from("dossiers")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dossierId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating dossier status:", updateError);
      return NextResponse.json(
        { error: "Failed to update dossier status" },
        { status: 500 }
      );
    }

    // Create DOSSIER_STATUS_CHANGED event
    const { error: eventError } = await supabase.from("events").insert({
      entity_type: "dossier",
      entity_id: dossierId,
      event_type: "DOSSIER_STATUS_CHANGED",
      actor_type: "AGENT",
      actor_id: agent.id,
      payload: {
        new_status: status,
        changed_by_agent: agent.id,
      },
    });

    if (eventError) {
      console.error("Error creating status change event:", eventError);
    }

    // TODO: Send notification to client
    // This would require implementing a notification system

    return NextResponse.json({
      success: true,
      dossier,
    });
  } catch (error) {
    console.error("Error in status change:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
