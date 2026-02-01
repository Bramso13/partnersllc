import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTwilioMessage } from "@/lib/twilio";
import { z } from "zod";

const SendMessageSchema = z.object({
  body: z.string().min(1).max(1600),
  dossier_id: z.string().uuid().optional(),
});

/**
 * POST /api/admin/conversations/[id]/messages
 * Send a message as admin: calls Twilio API then persists locally.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminProfile = await requireAdminAuth();

    const { id } = await params;
    const body: unknown = await request.json();
    const data = SendMessageSchema.parse(body);

    const supabase = createAdminClient();

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from("twilio_conversations")
      .select("id, twilio_conversation_sid, type, dossier_id")
      .eq("id", id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Send via Twilio (identity = admin profile ID)
    let twilioMessageSid: string | null = null;
    try {
      twilioMessageSid = await sendTwilioMessage(
        conversation.twilio_conversation_sid,
        data.body,
        adminProfile.id
      );
    } catch (err) {
      console.error("[POST /admin/conversations/[id]/messages] Twilio send failed:", err);
      // Still persist locally even if Twilio call fails
    }

    // Resolve dossier_id: use provided one for agent conversations, or the conversation's own dossier_id
    const dossierId = data.dossier_id ?? conversation.dossier_id;

    // Persist message
    const { data: message, error: insertError } = await supabase
      .from("twilio_conversation_messages")
      .insert({
        twilio_conversation_id: id,
        twilio_message_sid: twilioMessageSid,
        sender_type: "admin",
        sender_profile_id: adminProfile.id,
        body: data.body,
        dossier_id: dossierId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[POST /admin/conversations/[id]/messages] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to persist message" },
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
    console.error("[POST /admin/conversations/[id]/messages] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
