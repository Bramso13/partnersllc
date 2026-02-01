import { NextRequest, NextResponse } from "next/server";
import { requireClientAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 50;

/**
 * GET /api/conversations/[id]
 * Conversation detail + paginated messages.
 * Verifies the conversation belongs to the authenticated client (via dossier ownership).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireClientAuth();
    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch conversation and verify ownership via dossier
    const { data: conversation, error: convError } = await supabase
      .from("twilio_conversations")
      .select("*")
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

    // Paginated messages
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const perPage = Math.max(1, Math.min(100, parseInt(searchParams.get("per_page") ?? String(DEFAULT_PAGE_SIZE), 10)));
    const offset = (page - 1) * perPage;

    const { data: messages, error: msgError, count } = await supabase
      .from("twilio_conversation_messages")
      .select("*", { count: "exact" })
      .eq("twilio_conversation_id", id)
      .order("created_at", { ascending: true })
      .range(offset, offset + perPage - 1);

    if (msgError) {
      console.error("[GET /api/conversations/[id]] Messages error:", msgError);
    }

    return NextResponse.json({
      conversation,
      messages: messages ?? [],
      pagination: {
        page,
        per_page: perPage,
        total: count ?? 0,
      },
    });
  } catch (error) {
    console.error("[GET /api/conversations/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
