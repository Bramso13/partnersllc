import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTwilioMessage } from "@/lib/twilio";
import { sendMessageWithMedia, validateMediaSize } from "@/lib/twilio-media-upload";
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

    const contentType = request.headers.get("content-type") || "";
    let messageBody = "";
    let file: File | null = null;
    let dossierId = conversation.dossier_id;

    // Gérer FormData (avec fichier) ou JSON (texte seul)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      messageBody = (formData.get("body") as string) || "";
      file = formData.get("file") as File | null;
      const formDossierId = formData.get("dossier_id") as string | null;
      if (formDossierId) dossierId = formDossierId;
    } else {
      const body: unknown = await request.json();
      const data = SendMessageSchema.parse(body);
      messageBody = data.body;
      dossierId = data.dossier_id ?? conversation.dossier_id;
    }

    // Validation
    if (!messageBody.trim() && !file) {
      return NextResponse.json(
        { error: "Message body or file is required" },
        { status: 400 }
      );
    }

    // Send via Twilio (identity = admin profile ID)
    let twilioMessageSid: string | null = null;
    try {
      if (file) {
        console.log("[DEBUG] Sending file:", {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        // Valider la taille du fichier
        if (!validateMediaSize(file.size)) {
          return NextResponse.json(
            { error: "File size exceeds 150 MB limit" },
            { status: 400 }
          );
        }

        // Convertir en buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log("[DEBUG] Buffer size:", buffer.length);

        // Envoyer avec média
        console.log("[DEBUG] Calling sendMessageWithMedia...");
        const result = await sendMessageWithMedia(
          conversation.twilio_conversation_sid,
          id, // conversation ID pour les métadonnées
          messageBody || "",
          buffer,
          file.type,
          file.name,
          adminProfile.id,
          file.name, // title
          messageBody || undefined // description
        );
        twilioMessageSid = result.messageSid;
        console.log("[DEBUG] Message sent with SID:", twilioMessageSid);
        console.log("[DEBUG] Media ID:", result.mediaId);
        console.log("[DEBUG] Media URL:", result.mediaUrl);
      } else {
        twilioMessageSid = await sendTwilioMessage(
          conversation.twilio_conversation_sid,
          messageBody,
          adminProfile.id
        );
      }
    } catch (err) {
      console.error("[POST /admin/conversations/[id]/messages] Twilio send failed:", err);
      // Re-throw to see the error in the client
      throw err;
    }

    // Resolve dossier_id: use provided one for agent conversations, or the conversation's own dossier_id
    const finalBody = messageBody || (file ? `📎 ${file.name}` : "");

    // Persist message
    const { data: message, error: insertError } = await supabase
      .from("twilio_conversation_messages")
      .insert({
        twilio_conversation_id: id,
        twilio_message_sid: twilioMessageSid,
        sender_type: "admin",
        sender_profile_id: adminProfile.id,
        body: finalBody,
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

    return NextResponse.json(
      {
        message,
        ...(file && {
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        }),
      },
      { status: 201 }
    );
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
