import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 50;

/**
 * GET /api/admin/conversations/[id]
 * Conversation detail + participants + paginated messages.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const supabase = createAdminClient();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const perPage = Math.max(1, Math.min(100, parseInt(searchParams.get("per_page") ?? String(DEFAULT_PAGE_SIZE), 10)));
    const offset = (page - 1) * perPage;

    // Fetch conversation
    const { data: conversation, error: convError } = await supabase
      .from("twilio_conversations")
      .select("*")
      .eq("id", id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Fetch participants
    const { data: participants, error: partError } = await supabase
      .from("twilio_conversation_participants")
      .select("*")
      .eq("twilio_conversation_id", id)
      .order("created_at", { ascending: true });

    if (partError) {
      console.error("[GET /api/admin/conversations/[id]] Participants error:", partError);
    }

    // Fetch messages (paginated)
    const { data: messages, error: msgError, count } = await supabase
      .from("twilio_conversation_messages")
      .select("*", { count: "exact" })
      .eq("twilio_conversation_id", id)
      .order("created_at", { ascending: true })
      .range(offset, offset + perPage - 1);

    if (msgError) {
      console.error("[GET /api/admin/conversations/[id]] Messages error:", msgError);
    }

    return NextResponse.json({
      conversation,
      participants: participants ?? [],
      messages: messages ?? [],
      pagination: {
        page,
        per_page: perPage,
        total: count ?? 0,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/conversations/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
