import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { addAdminParticipant } from "@/lib/twilio";
import { z } from "zod";

const AddParticipantSchema = z.object({
  profile_id: z.string().uuid(),
});

/**
 * POST /api/admin/conversations/[id]/participants
 * Add an admin participant to the conversation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const body: unknown = await request.json();
    const data = AddParticipantSchema.parse(body);

    const supabase = createAdminClient();

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from("twilio_conversations")
      .select("id, twilio_conversation_sid")
      .eq("id", id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify admin profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", data.profile_id)
      .single();

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Profile not found or not an admin" },
        { status: 404 }
      );
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("twilio_conversation_participants")
      .select("id")
      .eq("twilio_conversation_id", id)
      .eq("profile_id", data.profile_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Participant already added" },
        { status: 409 }
      );
    }

    // Add participant on Twilio side
    const participantSid = await addAdminParticipant(
      conversation.twilio_conversation_sid,
      data.profile_id
    );

    // Persist participant
    const { data: participant, error: insertError } = await supabase
      .from("twilio_conversation_participants")
      .insert({
        twilio_conversation_id: id,
        profile_id: data.profile_id,
        twilio_participant_sid: participantSid,
        role: "admin",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[POST /api/admin/conversations/[id]/participants]", insertError);
      return NextResponse.json(
        { error: "Failed to add participant" },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[POST /api/admin/conversations/[id]/participants] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
