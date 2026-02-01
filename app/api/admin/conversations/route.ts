import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { createTwilioConversation, addClientParticipant, addAdminParticipant } from "@/lib/twilio";
import { z } from "zod";

const CreateConversationSchema = z.object({
  type: z.enum(["client", "agent"]),
  dossier_id: z.string().uuid().optional(),
  agent_profile_id: z.string().uuid().optional(),
});

/**
 * GET /api/admin/conversations
 * List conversations with optional filters: type, dossier_id, agent_profile_id
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    let query = supabase
      .from("twilio_conversations")
      .select("*")
      .order("created_at", { ascending: false });

    const type = searchParams.get("type");
    if (type === "client" || type === "agent") {
      query = query.eq("type", type);
    }

    const dossierId = searchParams.get("dossier_id");
    if (dossierId) {
      query = query.eq("dossier_id", dossierId);
    }

    const agentProfileId = searchParams.get("agent_profile_id");
    if (agentProfileId) {
      query = query.eq("agent_profile_id", agentProfileId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/admin/conversations]", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversations: data ?? [] });
  } catch (error) {
    console.error("[GET /api/admin/conversations] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/conversations
 * Create a new conversation. Calls Twilio API + persists to DB.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body: unknown = await request.json();
    const data = CreateConversationSchema.parse(body);

    // Validate type-specific requirements
    if (data.type === "client" && !data.dossier_id) {
      return NextResponse.json(
        { error: "dossier_id is required for type 'client'" },
        { status: 400 }
      );
    }
    if (data.type === "agent" && !data.agent_profile_id) {
      return NextResponse.json(
        { error: "agent_profile_id is required for type 'agent'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify referenced entities exist
    if (data.dossier_id) {
      const { data: dossier } = await supabase
        .from("dossiers")
        .select("id, user_id")
        .eq("id", data.dossier_id)
        .single();

      if (!dossier) {
        return NextResponse.json(
          { error: "Dossier not found" },
          { status: 404 }
        );
      }

      // Create Twilio Conversation and add client participant
      const { conversationSid, serviceSid } = await createTwilioConversation();

      // Fetch client phone from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", dossier.user_id)
        .single();

      if (profile?.phone) {
        console.log("Adding client participant to conversation", conversationSid, profile.phone);
        await addClientParticipant(conversationSid, profile.phone);
      }

      // Persist conversation
      const { data: conversation, error } = await supabase
        .from("twilio_conversations")
        .insert({
          twilio_conversation_sid: conversationSid,
          twilio_service_sid: serviceSid,
          type: "client",
          dossier_id: data.dossier_id,
        })
        .select()
        .single();

      if (error) {
        console.error("[POST /api/admin/conversations] Insert error:", error);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }

      return NextResponse.json({ conversation }, { status: 201 });
    }

    if (data.agent_profile_id) {
      const { data: agentProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.agent_profile_id)
        .single();

      if (!agentProfile) {
        return NextResponse.json(
          { error: "Agent profile not found" },
          { status: 404 }
        );
      }

      const { conversationSid, serviceSid } = await createTwilioConversation();

      // Add agent as identity participant
      await addAdminParticipant(conversationSid, data.agent_profile_id);

      const { data: conversation, error } = await supabase
        .from("twilio_conversations")
        .insert({
          twilio_conversation_sid: conversationSid,
          twilio_service_sid: serviceSid,
          type: "agent",
          agent_profile_id: data.agent_profile_id,
        })
        .select()
        .single();

      if (error) {
        console.error("[POST /api/admin/conversations] Insert error:", error);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }

      return NextResponse.json({ conversation }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[POST /api/admin/conversations] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
