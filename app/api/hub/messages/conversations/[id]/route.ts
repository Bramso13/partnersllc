import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHubUserIfMember } from "@/lib/hub-auth";
import type { SendMessageBody } from "@/types/hub-messages";

type RouteParams = { params: Promise<{ id: string }> };

const MESSAGES_PAGE_SIZE = 50;

// ── GET /api/hub/messages/conversations/[id] ──────────────────────────────────
// Retourne les messages d'une conversation (pagination par cursor)

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id: conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before") ?? "";

  const supabase = await createClient();

  // Vérifier que l'utilisateur fait partie de cette conversation
  const { data: conv } = await supabase
    .from("hub_conversations")
    .select("id, participant_a_id, participant_b_id")
    .eq("id", conversationId)
    .or(`participant_a_id.eq.${member.userId},participant_b_id.eq.${member.userId}`)
    .single();

  if (!conv) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  let query = supabase
    .from("hub_messages")
    .select("id, conversation_id, sender_id, content, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MESSAGES_PAGE_SIZE);

  if (before) query = query.lt("created_at", before);

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }

  // Marquer les messages non-lus comme lus
  await supabase
    .from("hub_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", member.userId)
    .is("read_at", null);

  return NextResponse.json({
    messages: (messages ?? []).reverse(),
    conversation: conv,
  });
}

// ── POST /api/hub/messages/conversations/[id] ─────────────────────────────────
// Envoie un message dans une conversation

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id: conversationId } = await params;

  let body: SendMessageBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Le contenu est requis" }, { status: 422 });
  }

  const supabase = await createClient();

  // Vérifier appartenance à la conversation
  const { data: conv } = await supabase
    .from("hub_conversations")
    .select("id")
    .eq("id", conversationId)
    .or(`participant_a_id.eq.${member.userId},participant_b_id.eq.${member.userId}`)
    .single();

  if (!conv) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  const { data: message, error } = await supabase
    .from("hub_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: member.userId,
      content: body.content.trim(),
    })
    .select("id, conversation_id, sender_id, content, read_at, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }

  return NextResponse.json({ message }, { status: 201 });
}
