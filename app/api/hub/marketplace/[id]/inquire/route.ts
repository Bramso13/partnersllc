import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHubUserIfMember } from "@/lib/hub-auth";
import type { SendInquiryBody } from "@/types/hub-marketplace";

type RouteParams = { params: Promise<{ id: string }> };

// ── POST /api/hub/marketplace/[id]/inquire ───────────────────────────────────
// Envoie une demande de contact au vendeur.
// Crée également une conversation hub_messages entre les deux parties.

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Accès réservé aux membres Hub" }, { status: 403 });
  }

  const { id: listingId } = await params;

  let body: SendInquiryBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Le message est requis" }, { status: 422 });
  }

  const supabase = await createClient();

  // Vérifier que le listing existe et est publié
  const { data: listing } = await supabase
    .from("hub_marketplace_listings")
    .select("id, seller_user_id, title")
    .eq("id", listingId)
    .eq("status", "published")
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }

  if (listing.seller_user_id === member.userId) {
    return NextResponse.json({ error: "Vous ne pouvez pas contacter votre propre offre" }, { status: 422 });
  }

  // Créer l'inquiry
  const { data: inquiry, error: inquiryError } = await supabase
    .from("hub_marketplace_inquiries")
    .insert({
      listing_id: listingId,
      buyer_user_id: member.userId,
      message: body.message.trim(),
    })
    .select("id, created_at")
    .single();

  if (inquiryError) {
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }

  // Ouvrir (ou réutiliser) une conversation messagerie entre les deux parties
  const [a, b] = [member.userId, listing.seller_user_id].sort();
  await supabase.from("hub_conversations").upsert(
    { participant_a_id: a, participant_b_id: b },
    { onConflict: "participant_a_id,participant_b_id" }
  );

  const { data: conv } = await supabase
    .from("hub_conversations")
    .select("id")
    .eq("participant_a_id", a)
    .eq("participant_b_id", b)
    .single();

  if (conv) {
    const intro = `[Offre : ${listing.title}]\n${body.message.trim()}`;
    await supabase.from("hub_messages").insert({
      conversation_id: conv.id,
      sender_id: member.userId,
      content: intro,
    });
  }

  return NextResponse.json({ inquiry }, { status: 201 });
}
