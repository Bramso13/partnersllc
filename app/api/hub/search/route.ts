import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  hubSearchQuerySchema,
  type HubSearchQuery,
} from "@/lib/validation/hub-search-schemas";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const BIO_SNIPPET_LENGTH = 100;

/** Échappe % et _ pour utilisation dans ILIKE */
function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type HubSearchResultItem = {
  id: string;
  user_id: string;
  display_name: string | null;
  profession: string | null;
  country: string | null;
  city: string | null;
  bio_snippet: string;
  avatar_url: string | null;
};

export type HubSearchResponse = {
  results: HubSearchResultItem[];
  total: number;
  page: number;
  limit: number;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data: subscription } = await supabase
      .from("hub_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json(
        { error: "Accès réservé aux membres du Hub" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const raw: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      raw[key] = value;
    });
    const parseResult = hubSearchQuerySchema.safeParse(raw);
    const params: any = parseResult.success // TODO: fix this
      ? parseResult.data
      : {
          page: 1,
          limit: DEFAULT_LIMIT,
        };

    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("hub_member_profiles")
      .select(
        "user_id, display_name, profession, country, city, bio, avatar_url",
        {
          count: "exact",
        }
      )
      .order("display_name", { ascending: true, nullsFirst: false });

    if (params.country?.length) {
      query = query.in("country", params.country);
    }
    if (params.profession?.length) {
      query = query.in("profession", params.profession);
    }
    if (params.expertise?.length) {
      query = query.overlaps("expertise_tags", params.expertise);
    }
    if (params.languages?.length) {
      const langConditions = params.languages
        .map((code: string) => `languages.cs.${JSON.stringify([{ code }])}`)
        .join(",");
      query = query.or(langConditions);
    }
    if (params.q) {
      const escaped = escapeIlike(params.q);
      const term = `%${escaped}%`;
      query = query.or(`display_name.ilike.${term},bio.ilike.${term}`);
    }

    const {
      data: rows,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("[hub/search] query error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la recherche" },
        { status: 500 }
      );
    }

    const results: HubSearchResultItem[] = (rows ?? []).map(
      (row: {
        user_id: string;
        display_name: string | null;
        profession: string | null;
        country: string | null;
        city: string | null;
        bio: string | null;
        avatar_url: string | null;
      }) => ({
        id: row.user_id,
        user_id: row.user_id,
        display_name: row.display_name ?? null,
        profession: row.profession ?? null,
        country: row.country ?? null,
        city: row.city ?? null,
        bio_snippet: (row.bio ?? "").slice(0, BIO_SNIPPET_LENGTH),
        avatar_url: row.avatar_url ?? null,
      })
    );

    const total = count ?? 0;

    const body: HubSearchResponse = {
      results,
      total,
      page,
      limit,
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("[hub/search] unexpected error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur lors de la recherche",
      },
      { status: 500 }
    );
  }
}
