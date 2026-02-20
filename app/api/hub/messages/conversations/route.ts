import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHubUserIfMember } from "@/lib/hub-auth";
import type { GetOrCreateConversationBody } from "@/types/hub-messages";

// ── GET /api/hub/messages/conversations ───────────────────────────────────────
// Retourne les conversations de l'utilisateur enrichies via la fonction DB

export async function GET(): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Accès réservé aux membres Hub" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_hub_conversations_for_user", {
    p_user_id: member.userId,
  });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }

  return NextResponse.json({ conversations: data ?? [] });
}

// ── POST /api/hub/messages/conversations ──────────────────────────────────────
// Crée ou récupère une conversation entre l'utilisateur et other_user_id.
// La paire est normalisée : min(a, b) → participant_a, max(a, b) → participant_b

export async function POST(request: NextRequest): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Accès réservé aux membres Hub" }, { status: 403 });
  }

  let body: GetOrCreateConversationBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { other_user_id } = body;

  if (!other_user_id?.trim()) {
    return NextResponse.json({ error: "other_user_id est requis" }, { status: 422 });
  }

  if (other_user_id === member.userId) {
    return NextResponse.json({ error: "Impossible de converser avec soi-même" }, { status: 422 });
  }

  // Vérifier que l'autre utilisateur est bien membre Hub
  const supabase = await createClient();
  const { data: otherSub } = await supabase
    .from("hub_subscriptions")
    .select("id")
    .eq("user_id", other_user_id)
    .eq("status", "active")
    .maybeSingle();

  if (!otherSub) {
    return NextResponse.json({ error: "Cet utilisateur n'est pas membre Hub" }, { status: 404 });
  }

  // Normaliser la paire pour respecter la contrainte participant_a < participant_b
  const [a, b] = [member.userId, other_user_id].sort();

  const { error: upsertError } = await supabase
    .from("hub_conversations")
    .upsert(
      { participant_a_id: a, participant_b_id: b },
      { onConflict: "participant_a_id,participant_b_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }

  const { data: conv } = await supabase
    .from("hub_conversations")
    .select("id, participant_a_id, participant_b_id, created_at")
    .eq("participant_a_id", a)
    .eq("participant_b_id", b)
    .single();

  return NextResponse.json({ conversation: conv }, { status: 201 });
}
