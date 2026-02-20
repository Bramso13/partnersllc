import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHubUserIfMember } from "@/lib/hub-auth";
import type { UpdateListingBody } from "@/types/hub-marketplace";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET /api/hub/marketplace/[id] ─────────────────────────────────────────────
// Détail d'une offre publiée (ou de sa propre offre)

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json(
      { error: "Accès réservé aux membres Hub" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hub_marketplace_listings")
    .select(
      `id, seller_user_id, title, description, category,
       price_type, price_amount, tags, status, created_at, updated_at,
       seller:hub_member_profiles!inner(display_name, profession)`
    )
    .eq("id", id)
    .or(`status.eq.published,seller_user_id.eq.${member.userId}`)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }

  const seller: {
    display_name: string | null;
    profession: string | null;
  } | null = data.seller as unknown as {
    display_name: string | null;
    profession: string | null;
  } | null;

  return NextResponse.json({
    listing: {
      ...data,
      seller_display_name: seller?.display_name ?? null,
      seller_profession: seller?.profession ?? null,
      seller: undefined,
    },
  });
}

// ── PATCH /api/hub/marketplace/[id] ──────────────────────────────────────────
// Met à jour une offre (vendeur uniquement)

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  let body: UpdateListingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hub_marketplace_listings")
    .update(body)
    .eq("id", id)
    .eq("seller_user_id", member.userId)
    .select("id, status, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Offre introuvable ou accès refusé" },
      { status: 404 }
    );
  }

  return NextResponse.json({ listing: data });
}

// ── DELETE /api/hub/marketplace/[id] ─────────────────────────────────────────
// Archive une offre (vendeur uniquement — suppression logique)

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("hub_marketplace_listings")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("seller_user_id", member.userId);

  if (error) {
    return NextResponse.json(
      { error: "Offre introuvable ou accès refusé" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
