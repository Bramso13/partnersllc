/**
 * POST /api/hub/profile/update
 * Auth Hub. Body: display_name, profession, country, bio, expertise_tags,
 * languages, years_experience, website, linkedin_url, twitter_handle.
 * Validation + sanitization (XSS). Update WHERE user_id = current_user.
 * Invalidation cache profil public.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireHubAuth } from "@/lib/hub-auth";
import { profileCache } from "@/lib/profile-cache";
import { hubProfileUpdateSchema } from "@/lib/validation/hub-profile-schemas";
import DOMPurify from "isomorphic-dompurify";

function sanitizeString(s: string | null | undefined): string | null {
  if (s == null || s === "") return null;
  return DOMPurify.sanitize(s.trim(), { ALLOWED_TAGS: [] });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireHubAuth();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body JSON invalide" },
        { status: 400 }
      );
    }

    const parsed = hubProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const raw = parsed.data;
    const display_name = sanitizeString(raw.display_name ?? undefined);
    const profession = sanitizeString(raw.profession ?? undefined);
    const country =
      raw.country != null && raw.country !== ""
        ? String(raw.country).trim().toUpperCase().slice(0, 2)
        : null;
    const bio = sanitizeString(raw.bio ?? undefined);
    const website =
      raw.website != null && raw.website !== ""
        ? DOMPurify.sanitize(raw.website.trim(), { ALLOWED_TAGS: [] })
        : null;
    const linkedin_url =
      raw.linkedin_url != null && raw.linkedin_url !== ""
        ? DOMPurify.sanitize(raw.linkedin_url.trim(), { ALLOWED_TAGS: [] })
        : null;
    const twitter_handle =
      raw.twitter_handle != null && raw.twitter_handle !== ""
        ? DOMPurify.sanitize(raw.twitter_handle.trim(), { ALLOWED_TAGS: [] })
        : null;
    const expertise_tags = Array.isArray(raw.expertise_tags)
      ? raw.expertise_tags
          .map((t) => DOMPurify.sanitize(String(t).trim(), { ALLOWED_TAGS: [] }))
          .filter((t) => t.length > 0)
          .slice(0, 20)
      : undefined;
    const languages = Array.isArray(raw.languages)
      ? raw.languages
          .slice(0, 10)
          .map((l) => ({
            code: String(l.code).trim().slice(0, 10),
            level: DOMPurify.sanitize(String(l.level).trim(), {
              ALLOWED_TAGS: [],
            }).slice(0, 50),
          }))
      : undefined;
    const years_experience =
      raw.years_experience !== undefined ? raw.years_experience : undefined;

    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (raw.display_name !== undefined) updatePayload.display_name = display_name;
    if (raw.profession !== undefined) updatePayload.profession = profession;
    if (raw.country !== undefined) updatePayload.country = country;
    if (raw.bio !== undefined) updatePayload.bio = bio;
    if (raw.website !== undefined) updatePayload.website = website;
    if (raw.linkedin_url !== undefined)
      updatePayload.linkedin_url = linkedin_url;
    if (raw.twitter_handle !== undefined)
      updatePayload.twitter_handle = twitter_handle;
    if (expertise_tags !== undefined) updatePayload.expertise_tags = expertise_tags;
    if (languages !== undefined) updatePayload.languages = languages;
    if (years_experience !== undefined)
      updatePayload.years_experience = years_experience;

    const { error } = await supabase
      .from("hub_member_profiles")
      .update(updatePayload)
      .eq("user_id", userId);

    if (error) {
      console.error("POST /api/hub/profile/update:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du profil" },
        { status: 500 }
      );
    }

    profileCache.del(profileCache.key(userId));

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
    console.error("POST /api/hub/profile/update:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Une erreur est survenue",
      },
      { status: 500 }
    );
  }
}
