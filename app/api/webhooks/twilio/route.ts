import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyTwilioSignature } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-twilio-signature") || "";
  const url = request.nextUrl.href;

  // Parse URL-encoded body (Twilio sends application/x-www-form-urlencoded)
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(body).entries()) {
    params[key] = value;
  }

  // Verify Twilio signature
  if (!verifyTwilioSignature(url, params, signature)) {
    console.error("[POST /api/webhooks/twilio] Signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 403 }
    );
  }

  const eventType = params["EventType"];

  if (eventType === "onMessageCreate") {
    try {
      await handleMessageCreate(params);
    } catch (error) {
      console.error("[POST /api/webhooks/twilio] Error handling message:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

async function handleMessageCreate(params: Record<string, string>): Promise<void> {
  const supabase = createAdminClient();

  const conversationSid = params["ConversationSid"];
  const messageSid = params["MessageSid"];
  const messageBody = params["Body"];
  const participantIdentity = params["ParticipantIdentity"];
  const participantMessagingAddress = params["ParticipantMessagingAddress"];

  if (!conversationSid || !messageSid || !messageBody) {
    console.error("[handleMessageCreate] Missing required params");
    return;
  }

  // Resolve the platform conversation from the Twilio SID
  const { data: conversation, error: convError } = await supabase
    .from("twilio_conversations")
    .select("id, type, dossier_id, agent_profile_id")
    .eq("twilio_conversation_sid", conversationSid)
    .single();

  if (convError || !conversation) {
    console.error("[handleMessageCreate] Conversation not found for SID:", conversationSid);
    return;
  }

  // Resolve sender_type and sender_profile_id from Twilio participant info
  let senderType: "admin" | "client" | "agent" = "client";
  let senderProfileId: string | null = null;

  if (participantIdentity) {
    // Identity-based participant → admin (or agent matched by profile ID)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", participantIdentity)
      .single();

    if (profile) {
      senderProfileId = profile.id;
      senderType = profile.role === "ADMIN" ? "admin" : "agent";
    }
  } else if (participantMessagingAddress) {
    // Messaging-binding participant → external client
    // Try to match by phone on the dossier's owner profile
    if (conversation.dossier_id) {
      const { data: dossierOwner } = await supabase
        .from("dossiers")
        .select("user_id")
        .eq("id", conversation.dossier_id)
        .single();

      if (dossierOwner) {
        senderProfileId = dossierOwner.user_id;
        senderType = "client";
      }
    }
  }

  // Persist the message
  const { error: insertError } = await supabase
    .from("twilio_conversation_messages")
    .insert({
      twilio_conversation_id: conversation.id,
      twilio_message_sid: messageSid,
      sender_type: senderType,
      sender_profile_id: senderProfileId,
      body: messageBody,
      dossier_id: conversation.dossier_id,
    });

  if (insertError) {
    console.error("[handleMessageCreate] Failed to insert message:", insertError);
  }
}
