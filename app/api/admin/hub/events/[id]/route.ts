import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/admin/hub/events/[id] ─────────────────────────────────────────
// Met à jour un événement Hub

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireAdminAuth();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const {
    title, description, type, start_at, end_at,
    timezone, location_text, meet_url, max_attendees,
    status, cover_image_url, tags,
  } = body as {
    title?: string; description?: string; type?: string;
    start_at?: string; end_at?: string; timezone?: string;
    location_text?: string; meet_url?: string; max_attendees?: number | null;
    status?: string; cover_image_url?: string; tags?: string[];
  };

  if (title !== undefined && (title.trim().length < 3 || title.trim().length > 150)) {
    return NextResponse.json(
      { error: "Le titre doit contenir entre 3 et 150 caractères" },
      { status: 422 }
    );
  }

  if (start_at && end_at && new Date(end_at) <= new Date(start_at)) {
    return NextResponse.json(
      { error: "La date de fin doit être après la date de début" },
      { status: 422 }
    );
  }

  const supabase = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (title !== undefined)          patch.title = title.trim();
  if (description !== undefined)    patch.description = description?.trim() ?? null;
  if (type !== undefined)           patch.type = type;
  if (start_at !== undefined)       patch.start_at = start_at;
  if (end_at !== undefined)         patch.end_at = end_at ?? null;
  if (timezone !== undefined)       patch.timezone = timezone;
  if (location_text !== undefined)  patch.location_text = location_text?.trim() ?? null;
  if (meet_url !== undefined)       patch.meet_url = meet_url?.trim() ?? null;
  if (max_attendees !== undefined)  patch.max_attendees = max_attendees ?? null;
  if (status !== undefined)         patch.status = status;
  if (cover_image_url !== undefined) patch.cover_image_url = cover_image_url?.trim() ?? null;
  if (tags !== undefined)           patch.tags = tags;

  const { data, error } = await supabase
    .from("hub_events")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/hub/events] PATCH error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }

  return NextResponse.json({ event: data });
}

// ── DELETE /api/admin/hub/events/[id] ────────────────────────────────────────
// Supprime définitivement un événement (et ses inscriptions en cascade)

export async function DELETE(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireAdminAuth();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("hub_events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[admin/hub/events] DELETE error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
