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
    const { cancellationReason } = body;

    if (!cancellationReason || !cancellationReason.trim()) {
      return NextResponse.json(
        { error: "Cancellation reason is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current dossier to merge metadata
    const { data: currentDossier } = await supabase
      .from("dossiers")
      .select("metadata")
      .eq("id", dossierId)
      .single();

    // Update dossier status to CLOSED and store cancellation data in metadata
    const updatedMetadata = {
      ...(currentDossier?.metadata || {}),
      cancelled_at: new Date().toISOString(),
      cancellation_reason: cancellationReason.trim(),
      cancelled_by_agent_id: agent.id,
    };

    const { data: dossier, error: updateError } = await supabase
      .from("dossiers")
      .update({
        status: "CLOSED",
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dossierId)
      .select()
      .single();

    if (updateError) {
      console.error("Error cancelling dossier:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel dossier" },
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
        new_status: "CLOSED",
        action: "cancelled",
        cancellation_reason: cancellationReason.trim(),
        cancelled_by_agent: agent.id,
      },
    });

    if (eventError) {
      console.error("Error creating cancellation event:", eventError);
    }

    // TODO: Send notification to client
    // This would require implementing a notification system

    return NextResponse.json({
      success: true,
      dossier,
    });
  } catch (error) {
    console.error("Error in cancel dossier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
