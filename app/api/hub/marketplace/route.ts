import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHubUserIfMember } from "@/lib/hub-auth";
import type {
  CreateListingBody,
  ListingsResponse,
  MarketplaceListing,
} from "@/types/hub-marketplace";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// ── GET /api/hub/marketplace ──────────────────────────────────────────────────
// Liste les offres publiées avec filtres optionnels (category, q, page, limit)

export async function GET(request: NextRequest): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json(
      { error: "Accès réservé aux membres Hub" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    MAX_LIMIT,
    parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)
  );
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from("hub_marketplace_listings")
    .select(
      `id, seller_user_id, title, description, category,
       price_type, price_amount, tags, status, created_at, updated_at`,
      { count: "exact" }
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }

  // Noms des vendeurs via hub_member_profiles (pas de FK directe avec hub_marketplace_listings)
  type RawRow = {
    id: string;
    seller_user_id: string;
    title: string;
    description: string;
    category: string;
    price_type: string;
    price_amount: number | null;
    tags: string[];
    status: string;
    created_at: string;
    updated_at: string;
  };
  const rows = (data as unknown as RawRow[]) ?? [];
  const sellerIds = [...new Set(rows.map((r) => r.seller_user_id))];

  const { data: profiles } = await supabase
    .from("hub_member_profiles")
    .select("user_id, display_name, profession")
    .in("user_id", sellerIds);

  const profileMap = new Map(
    (profiles ?? []).map(
      (p: {
        user_id: string;
        display_name: string | null;
        profession: string | null;
      }) => [
        p.user_id,
        { display_name: p.display_name, profession: p.profession },
      ]
    )
  );

  const listings = rows.map((row) => ({
    id: row.id,
    seller_user_id: row.seller_user_id,
    seller_display_name:
      profileMap.get(row.seller_user_id)?.display_name ?? null,
    seller_profession: profileMap.get(row.seller_user_id)?.profession ?? null,
    title: row.title,
    description: row.description,
    category: row.category,
    price_type: row.price_type as MarketplaceListing["price_type"],
    price_amount: row.price_amount ?? null,
    tags: row.tags ?? [],
    status: row.status as MarketplaceListing["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const body: ListingsResponse = { listings, total: count ?? 0, page, limit };
  return NextResponse.json(body);
}

// ── POST /api/hub/marketplace ─────────────────────────────────────────────────
// Crée une nouvelle offre (brouillon par défaut)

export async function POST(request: NextRequest): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json(
      { error: "Accès réservé aux membres Hub" },
      { status: 403 }
    );
  }

  let body: CreateListingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const { title, description, category, price_type, price_amount, tags } = body;

  if (!title?.trim() || !description?.trim() || !category?.trim() || !price_type) {
    return NextResponse.json(
      { error: "Champs obligatoires manquants" },
      { status: 422 }
    );
  }

  const titleTrimmed = title.trim();
  const descriptionTrimmed = description.trim();

  if (titleTrimmed.length < 3 || titleTrimmed.length > 100) {
    return NextResponse.json(
      { error: "Le titre doit contenir entre 3 et 100 caractères" },
      { status: 422 }
    );
  }

  if (descriptionTrimmed.length < 10 || descriptionTrimmed.length > 2000) {
    return NextResponse.json(
      { error: "La description doit contenir entre 10 et 2000 caractères" },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hub_marketplace_listings")
    .insert({
      seller_user_id: member.userId,
      title: titleTrimmed,
      description: descriptionTrimmed,
      category: category.trim(),
      price_type,
      price_amount: price_amount ?? null,
      tags: tags ?? [],
      status: "published",
    })
    .select("id, title, status, created_at")
    .single();

  if (error) {
    console.error("[hub/marketplace] insert error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    );
  }

  return NextResponse.json({ listing: data }, { status: 201 });
}
