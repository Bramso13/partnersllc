import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { PutStepFormationCustomRequest } from "@/types/formations";

const PutBodySchema = z.object({
  title: z.string().min(1).optional(),
  html_content: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

/**
 * PUT /api/admin/steps/[step_id]/formations-custom/[id]
 * Update a custom formation. Admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ step_id: string; id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id, id } = await params;

    const body = await request.json();
    const parsed = PutBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: PutStepFormationCustomRequest = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.html_content !== undefined)
      updates.html_content = parsed.data.html_content;
    if (parsed.data.position !== undefined)
      updates.position = parsed.data.position;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("step_formation_custom")
      .update(updates)
      .eq("id", id)
      .eq("step_id", step_id)
      .select("id, step_id, position, title, html_content")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Custom formation not found" },
          { status: 404 }
        );
      }
      console.error(
        "[PUT /api/admin/steps/[step_id]/formations-custom/[id]]",
        error
      );
      return NextResponse.json(
        { error: "Failed to update custom formation" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "[PUT /api/admin/steps/[step_id]/formations-custom/[id]]",
      error
    );
    return NextResponse.json(
      { error: "Failed to update custom formation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/steps/[step_id]/formations-custom/[id]
 * Delete a custom formation. Admin only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ step_id: string; id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id, id } = await params;

    const { error } = await supabase
      .from("step_formation_custom")
      .delete()
      .eq("id", id)
      .eq("step_id", step_id);

    if (error) {
      console.error(
        "[DELETE /api/admin/steps/[step_id]/formations-custom/[id]]",
        error
      );
      return NextResponse.json(
        { error: "Failed to delete custom formation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "[DELETE /api/admin/steps/[step_id]/formations-custom/[id]]",
      error
    );
    return NextResponse.json(
      { error: "Failed to delete custom formation" },
      { status: 500 }
    );
  }
}
