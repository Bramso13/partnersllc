import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHubUserIfMember } from "@/lib/hub-auth";

type RouteParams = { params: Promise<{ id: string }> };

// ── POST /api/hub/events/[id]/register ───────────────────────────────────────
// Inscrit l'utilisateur à un événement.
// Si max_attendees est atteint, le place en liste d'attente.

export async function POST(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Accès réservé aux membres Hub" }, { status: 403 });
  }

  const { id: eventId } = await params;
  const supabase = await createClient();

  // Vérifier que l'événement existe et est publié
  const { data: event } = await supabase
    .from("hub_events")
    .select("id, max_attendees, start_at")
    .eq("id", eventId)
    .eq("status", "published")
    .single();

  if (!event) {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
  }

  if (new Date(event.start_at) < new Date()) {
    return NextResponse.json({ error: "Cet événement est déjà passé" }, { status: 422 });
  }

  // Compter les inscrits actuels
  const { count } = await supabase
    .from("hub_event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "registered");

  const isFull = event.max_attendees !== null && (count ?? 0) >= event.max_attendees;
  const status = isFull ? "waitlisted" : "registered";

  const { data: registration, error } = await supabase
    .from("hub_event_registrations")
    .upsert(
      { event_id: eventId, user_id: member.userId, status },
      { onConflict: "event_id,user_id" }
    )
    .select("id, event_id, user_id, status, registered_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
  }

  return NextResponse.json({ registration, waitlisted: isFull }, { status: 201 });
}

// ── DELETE /api/hub/events/[id]/register ─────────────────────────────────────
// Annule l'inscription de l'utilisateur

export async function DELETE(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const member = await getHubUserIfMember();
  if (!member) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id: eventId } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("hub_event_registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", member.userId);

  if (error) {
    return NextResponse.json({ error: "Impossible d'annuler l'inscription" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
