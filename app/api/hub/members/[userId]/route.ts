/**
 * GET /api/hub/members/[userId]
 * Auth Hub requise. Retourne le profil public du membre.
 * Vérifie abonnement Hub actif du membre cible (sinon 404). Cache 10 min.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireHubAuth } from "@/lib/hub-auth";
import { profileCache } from "@/lib/profile-cache";
import type { HubMemberProfilePublic } from "@/types/hub-profile";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireHubAuth();
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: "userId manquant" },
        { status: 400 }
      );
    }

    const cacheKey = profileCache.key(userId);
    const cached = profileCache.get<HubMemberProfilePublic>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const admin = createAdminClient();

    // Vérifier que le membre cible a un abonnement Hub actif
    const { data: sub } = await admin
      .from("hub_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { error: "Profil non trouvé ou membre inactif" },
        { status: 404 }
      );
    }

    const { data: row, error } = await admin
      .from("hub_member_profiles")
      .select(
        "id, user_id, display_name, profession, country, city, bio, avatar_url, expertise_tags, languages, years_experience, website, linkedin_url, twitter_handle, is_llc_client, created_at, updated_at"
      )
      .eq("user_id", userId)
      .single();

    if (error || !row) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    const profile: HubMemberProfilePublic = {
      id: row.id,
      user_id: row.user_id,
      display_name: row.display_name ?? null,
      profession: row.profession ?? null,
      country: row.country ?? null,
      city: row.city ?? null,
      bio: row.bio ?? null,
      avatar_url: row.avatar_url ?? null,
      expertise_tags: Array.isArray(row.expertise_tags) ? row.expertise_tags : [],
      languages: Array.isArray(row.languages) ? row.languages : [],
      years_experience: row.years_experience ?? null,
      website: row.website ?? null,
      linkedin_url: row.linkedin_url ?? null,
      twitter_handle: row.twitter_handle ?? null,
      is_llc_client: row.is_llc_client ?? false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    profileCache.set(cacheKey, profile);

    return NextResponse.json(profile);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
    console.error("GET /api/hub/members/[userId]:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Une erreur est survenue",
      },
      { status: 500 }
    );
  }
}
