import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHubUserIfMember } from "@/lib/hub-auth";

// ── GET /api/hub/marketplace/mine ─────────────────────────────────────────────
// Retourne toutes les offres du membre connecté (tous statuts confondus)

export async function GET(): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Accès réservé aux membres Hub" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hub_marketplace_listings")
    .select("id, title, category, price_type, price_amount, status, created_at, updated_at")
    .eq("seller_user_id", member.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }

  return NextResponse.json({ listings: data ?? [] });
}
