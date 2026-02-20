import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHubUserIfMember } from "@/lib/hub-auth";
import type { EventsResponse } from "@/types/hub-events";

// ── GET /api/hub/events ───────────────────────────────────────────────────────
// Liste les événements publiés avec le statut d'inscription de l'utilisateur

export async function GET(request: NextRequest): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json(
      { error: "Accès réservé aux membres Hub" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const upcoming = searchParams.get("upcoming") !== "false";
  const tag = searchParams.get("tag")?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("hub_events")
    .select(
      `id, organizer_user_id, title, description, type,
       start_at, end_at, timezone, location_text, meet_url,
       max_attendees, status, cover_image_url, tags, created_at`,
      { count: "exact" }
    )
    .eq("status", "published")
    .order("start_at", { ascending: true });

  if (upcoming) query = query.gte("start_at", new Date().toISOString());
  if (tag) query = query.contains("tags", [tag]);

  const { data: events, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ events: [], total: 0 } satisfies EventsResponse);
  }

  type RawEvent = {
    id: string; organizer_user_id: string; title: string; description: string | null;
    type: string; start_at: string; end_at: string | null; timezone: string;
    location_text: string | null; meet_url: string | null; max_attendees: number | null;
    status: string; cover_image_url: string | null; tags: string[]; created_at: string;
  };
  const typedEvents = events as unknown as RawEvent[];

  // Noms des organisateurs via hub_member_profiles (pas de FK directe avec hub_events)
  const eventIds = typedEvents.map((e) => e.id);
  const organizerIds = [...new Set(typedEvents.map((e) => e.organizer_user_id))];
  const { data: profiles } = await supabase
    .from("hub_member_profiles")
    .select("user_id, display_name")
    .in("user_id", organizerIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: { user_id: string; display_name: string | null }) => [p.user_id, p.display_name])
  );
  const { data: registrations } = await supabase
    .from("hub_event_registrations")
    .select("event_id, status")
    .eq("user_id", member.userId)
    .in("event_id", eventIds);

  const regMap = new Map(
    (registrations ?? []).map((r: { event_id: string; status: string }) => [
      r.event_id,
      r.status,
    ])
  );

  // Compteur d'inscrits par événement
  const { data: counts } = await supabase
    .from("hub_event_registrations")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("status", "registered");

  const countMap = new Map<string, number>();
  (counts ?? []).forEach((r: { event_id: string }) => {
    countMap.set(r.event_id, (countMap.get(r.event_id) ?? 0) + 1);
  });

  const enriched = typedEvents.map((row) => ({
    id: row.id,
    organizer_user_id: row.organizer_user_id,
    organizer_display_name: profileMap.get(row.organizer_user_id) ?? null,
    title: row.title,
    description: row.description ?? null,
    type: row.type as import("@/types/hub-events").HubEvent["type"],
    start_at: row.start_at,
    end_at: row.end_at ?? null,
    timezone: row.timezone,
    location_text: row.location_text ?? null,
    meet_url: row.meet_url ?? null,
    max_attendees: row.max_attendees ?? null,
    attendee_count: countMap.get(row.id) ?? 0,
    status: row.status as import("@/types/hub-events").HubEvent["status"],
    cover_image_url: row.cover_image_url ?? null,
    tags: row.tags ?? [],
    created_at: row.created_at,
    is_registered: regMap.has(row.id),
    registration_status: (regMap.get(row.id) ?? null) as import("@/types/hub-events").HubEventRegistrationStatus | null,
  }));

  return NextResponse.json({
    events: enriched,
    total: count ?? 0,
  } satisfies EventsResponse);
}
