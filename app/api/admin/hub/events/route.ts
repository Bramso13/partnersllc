import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// ── GET /api/admin/hub/events ─────────────────────────────────────────────────
// Liste tous les événements Hub (tous statuts) avec compteur d'inscrits

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdminAuth();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: events, error } = await supabase
    .from("hub_events")
    .select(
      `id, organizer_user_id, title, description, type,
       start_at, end_at, timezone, location_text, meet_url,
       max_attendees, status, cover_image_url, tags, created_at, updated_at`
    )
    .order("start_at", { ascending: false });

  if (error) {
    console.error("[admin/hub/events] GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }

  const eventIds = (events ?? []).map((e) => e.id as string);

  // Compteur d'inscrits actifs par événement
  const { data: counts } = await supabase
    .from("hub_event_registrations")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("status", "registered");

  const countMap = new Map<string, number>();
  (counts ?? []).forEach((r: { event_id: string }) => {
    countMap.set(r.event_id, (countMap.get(r.event_id) ?? 0) + 1);
  });

  const enriched = (events ?? []).map((e) => ({
    ...e,
    attendee_count: countMap.get(e.id as string) ?? 0,
  }));

  return NextResponse.json({ events: enriched });
}

// ── POST /api/admin/hub/events ────────────────────────────────────────────────
// Crée un événement Hub (l'admin est défini comme organisateur)

export async function POST(request: NextRequest): Promise<NextResponse> {
  let admin;
  try {
    admin = await requireAdminAuth();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const {
    title,
    description,
    type,
    start_at,
    end_at,
    timezone,
    location_text,
    meet_url,
    max_attendees,
    status,
    cover_image_url,
    tags,
  } = body as {
    title: string;
    description?: string;
    type: string;
    start_at: string;
    end_at?: string;
    timezone?: string;
    location_text?: string;
    meet_url?: string;
    max_attendees?: number;
    status?: string;
    cover_image_url?: string;
    tags?: string[];
  };

  if (!title?.trim() || !type || !start_at) {
    return NextResponse.json(
      { error: "title, type et start_at sont obligatoires" },
      { status: 422 }
    );
  }

  if (title.trim().length < 3 || title.trim().length > 150) {
    return NextResponse.json(
      { error: "Le titre doit contenir entre 3 et 150 caractères" },
      { status: 422 }
    );
  }

  if (end_at && new Date(end_at) <= new Date(start_at)) {
    return NextResponse.json(
      { error: "La date de fin doit être après la date de début" },
      { status: 422 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("hub_events")
    .insert({
      organizer_user_id: admin.id as string,
      title: title.trim(),
      description: description?.trim() ?? null,
      type,
      start_at,
      end_at: end_at ?? null,
      timezone: (timezone as string) ?? "Europe/Paris",
      location_text: location_text?.trim() ?? null,
      meet_url: meet_url?.trim() ?? null,
      max_attendees: max_attendees ?? null,
      status: status ?? "draft",
      cover_image_url: cover_image_url?.trim() ?? null,
      tags: tags ?? [],
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/hub/events] POST error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    );
  }

  return NextResponse.json({ event: data }, { status: 201 });
}
