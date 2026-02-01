import { NextRequest, NextResponse } from "next/server";
import { requireClientAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTwilioMessage } from "@/lib/twilio";
import { z } from "zod";

const SendMessageSchema = z.object({
  body: z.string().min(1).max(1600),
});

/**
 * POST /api/conversations/[id]/messages
 * Client sends a message: calls Twilio API then persists locally.
 * Verifies conversation ownership via dossier.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireClientAuth();
    const { id } = await params;
    const body: unknown = await request.json();
    const data = SendMessageSchema.parse(body);

    const supabase = createAdminClient();

    // Fetch and verify conversation ownership
    const { data: conversation, error: convError } = await supabase
      .from("twilio_conversations")
      .select("id, twilio_conversation_sid, dossier_id, type")
      .eq("id", id)
      .eq("type", "client")
      .single();

    if (convError || !conversation || !conversation.dossier_id) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify dossier ownership
    const { data: dossier } = await supabase
      .from("dossiers")
      .select("id")
      .eq("id", conversation.dossier_id)
      .eq("user_id", profile.id)
      .single();

    if (!dossier) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Send via Twilio (identity = client profile ID)
    let twilioMessageSid: string | null = null;
    try {
      twilioMessageSid = await sendTwilioMessage(
        conversation.twilio_conversation_sid,
        data.body,
        profile.id
      );
    } catch (err) {
      console.error("[POST /api/conversations/[id]/messages] Twilio send failed:", err);
    }

    // Persist message
    const { data: message, error: insertError } = await supabase
      .from("twilio_conversation_messages")
      .insert({
        twilio_conversation_id: id,
        twilio_message_sid: twilioMessageSid,
        sender_type: "client",
        sender_profile_id: profile.id,
        body: data.body,
        dossier_id: conversation.dossier_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[POST /api/conversations/[id]/messages] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[POST /api/conversations/[id]/messages] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
