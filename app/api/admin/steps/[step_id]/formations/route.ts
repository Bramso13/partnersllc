import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { GetStepFormationsResponse } from "@/types/formations";

const PutBodySchema = z.object({
  formation_ids: z.array(z.string().uuid()),
});

/**
 * GET /api/admin/steps/[step_id]/formations
 * Return formations linked to this step (id, titre, position). Admin only.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id } = await params;

    const { data: rows, error: linkError } = await supabase
      .from("step_formations")
      .select("formation_id, position")
      .eq("step_id", step_id)
      .order("position", { ascending: true });

    if (linkError) {
      console.error("[GET /api/admin/steps/[step_id]/formations]", linkError);
      return NextResponse.json(
        { error: "Failed to fetch step formations" },
        { status: 500 }
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        formations: [],
      } satisfies GetStepFormationsResponse);
    }

    const formationIds = rows.map((r) => r.formation_id);
    const { data: formations, error: formError } = await supabase
      .from("formations")
      .select("id, titre, description, vignette_url")
      .in("id", formationIds);

    if (formError) {
      console.error("[GET /api/admin/steps/[step_id]/formations]", formError);
      return NextResponse.json(
        { error: "Failed to fetch formations" },
        { status: 500 }
      );
    }

    const byId = new Map(
      (formations ?? []).map((f) => [f.id, { id: f.id, titre: f.titre, description: f.description ?? null, vignette_url: f.vignette_url ?? null }])
    );
    const ordered = rows
      .map((r) => byId.get(r.formation_id))
      .filter(Boolean) as GetStepFormationsResponse["formations"];

    return NextResponse.json({ formations: ordered });
  } catch (error) {
    console.error("[GET /api/admin/steps/[step_id]/formations]", error);
    return NextResponse.json(
      { error: "Failed to fetch step formations" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/steps/[step_id]/formations
 * Replace associations: delete existing links for step_id, insert formation_ids (with position order).
 * Admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id } = await params;

    const body = await request.json();
    const parsed = PutBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { formation_ids } = parsed.data;

    const { error: stepError } = await supabase
      .from("steps")
      .select("id")
      .eq("id", step_id)
      .single();

    if (stepError) {
      if (stepError.code === "PGRST116") {
        return NextResponse.json({ error: "Step not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to verify step" },
        { status: 500 }
      );
    }

    if (formation_ids.length > 0) {
      const { data: existing } = await supabase
        .from("formations")
        .select("id")
        .in("id", formation_ids);
      const foundIds = new Set((existing ?? []).map((f) => f.id));
      const missing = formation_ids.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: "Some formation_ids do not exist", invalid_ids: missing },
          { status: 400 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("step_formations")
      .delete()
      .eq("step_id", step_id);

    if (deleteError) {
      console.error("[PUT /api/admin/steps/[step_id]/formations] delete", deleteError);
      return NextResponse.json(
        { error: "Failed to update step formations" },
        { status: 500 }
      );
    }

    if (formation_ids.length > 0) {
      const inserts = formation_ids.map((formation_id, index) => ({
        step_id,
        formation_id,
        position: index,
      }));
      const { error: insertError } = await supabase
        .from("step_formations")
        .insert(inserts);

      if (insertError) {
        console.error("[PUT /api/admin/steps/[step_id]/formations] insert", insertError);
        return NextResponse.json(
          { error: "Failed to update step formations" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/admin/steps/[step_id]/formations]", error);
    return NextResponse.json(
      { error: "Failed to update step formations" },
      { status: 500 }
    );
  }
}
