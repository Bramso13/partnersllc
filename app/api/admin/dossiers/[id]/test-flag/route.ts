import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TestFlagBodySchema = z.object({
  is_test: z.boolean(),
});

/**
 * PATCH /api/admin/dossiers/[id]/test-flag
 * Update dossier is_test flag (admin only).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId } = await params;

    const body: unknown = await request.json();
    const parsed = TestFlagBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: dossier, error } = await supabase
      .from("dossiers")
      .update({
        is_test: parsed.data.is_test,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dossierId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/admin/dossiers/[id]/test-flag]", error);
      return NextResponse.json(
        { error: "Failed to update dossier test flag" },
        { status: 500 }
      );
    }

    return NextResponse.json({ dossier });
  } catch (error) {
    console.error(
      "[PATCH /api/admin/dossiers/[id]/test-flag] Unexpected error:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
