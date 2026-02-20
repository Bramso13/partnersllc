import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHubMemberOrNull } from "@/lib/hub/auth";
import { cacheGet, cacheSet, HUB_CACHE_KEYS } from "@/lib/hub/cache";
import type { HubMemberSearchResult } from "@/lib/hub/types";

const SUGGESTIONS_LIMIT = 10;
const FETCH_LIMIT = 50; // on en récupère plus puis on randomise

function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function toSearchResult(row: {
  id: string;
  user_id: string;
  display_name: string | null;
  profession: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
}): HubMemberSearchResult {
  return {
    id: row.id,
    user_id: row.user_id,
    display_name: row.display_name,
    profession: row.profession,
    country: row.country,
    city: row.city ?? null,
    bio_snippet: row.bio ? row.bio.slice(0, 120) : null,
    avatar_url: null, // colonne optionnelle (story 16.1)
  };
}

/**
 * GET /api/hub/suggestions
 * Auth Hub requise. Membres avec (country = user.country OR profession = user.profession), exclut soi-même.
 * Limite 10, ordre aléatoire. Cache 1 h par user.
 */
export async function GET() {
  const member = await getHubMemberOrNull();
  if (!member) {
    return NextResponse.json(
      { error: "Authentification Hub requise" },
      { status: 401 }
    );
  }

  const cacheKey = HUB_CACHE_KEYS.suggestions(member.profile.user_id);
  const cached = cacheGet<HubMemberSearchResult[]>(cacheKey);
  if (cached !== undefined) {
    return NextResponse.json({ results: cached });
  }

  const supabase = await createClient();
  const { country, profession, user_id } = member.profile;

  // Pas de critères => pas de suggestions
  if (!country && !profession) {
    const empty: HubMemberSearchResult[] = [];
    cacheSet(cacheKey, empty);
    return NextResponse.json({ results: empty });
  }

  let query = supabase
    .from("hub_member_profiles")
    .select("id, user_id, display_name, profession, country, city, bio")
    .neq("user_id", user_id)
    .limit(FETCH_LIMIT);

  if (country && profession) {
    query = query.or(`country.eq.${country},profession.eq.${profession}`);
  } else if (country) {
    query = query.eq("country", country);
  } else {
    query = query.eq("profession", profession);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("[hub/suggestions]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des suggestions" },
      { status: 500 }
    );
  }

  const results = shuffle(rows ?? [])
    .slice(0, SUGGESTIONS_LIMIT)
    .map(toSearchResult);

  cacheSet(cacheKey, results);

  return NextResponse.json({ results });
}
