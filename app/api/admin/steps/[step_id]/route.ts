import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/steps/[step_id]
 * Fetch a single step (optional, for edit form prefill or detail view)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id } = await params;

    const { data, error } = await supabase
      .from("steps")
      .select("*")
      .eq("id", step_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Step not found" }, { status: 404 });
      }
      console.error("[GET /api/admin/steps/[step_id]]", error);
      return NextResponse.json(
        { error: "Failed to fetch step" },
        { status: 500 }
      );
    }

    return NextResponse.json({ step: data });
  } catch (error) {
    console.error("[GET /api/admin/steps/[step_id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch step" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/steps/[step_id]
 * Update step (label, description, position, step_type). Code is immutable.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id } = await params;
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { label, description, position, step_type } = body as {
      label?: string;
      description?: string | null;
      position?: number;
      step_type?: "CLIENT" | "ADMIN";
    };

    const updateData: Record<string, unknown> = {};

    if (label !== undefined) {
      if (typeof label !== "string" || label.length < 2 || label.length > 100) {
        return NextResponse.json(
          {
            error: "Label must be between 2 and 100 characters",
            details: { field: "label" },
          },
          { status: 400 }
        );
      }
      updateData.label = label;
    }

    if (description !== undefined) {
      if (
        description !== null &&
        (typeof description !== "string" || description.length > 500)
      ) {
        return NextResponse.json(
          {
            error: "Description must not exceed 500 characters",
            details: { field: "description" },
          },
          { status: 400 }
        );
      }
      updateData.description = description ?? null;
    }

    if (position !== undefined) {
      const pos =
        typeof position === "number"
          ? position
          : parseInt(String(position), 10);
      if (isNaN(pos)) {
        return NextResponse.json(
          {
            error: "Position must be a number",
            details: { field: "position" },
          },
          { status: 400 }
        );
      }
      // Check position uniqueness (excluding current step)
      const { data: existingAtPosition } = await supabase
        .from("steps")
        .select("id")
        .eq("position", pos)
        .neq("id", step_id)
        .single();
      if (existingAtPosition) {
        return NextResponse.json(
          {
            error: "Position already taken",
            details: { field: "position" },
          },
          { status: 409 }
        );
      }
      updateData.position = pos;
    }

    if (step_type !== undefined) {
      if (step_type !== "CLIENT" && step_type !== "ADMIN") {
        return NextResponse.json(
          {
            error: "step_type must be CLIENT or ADMIN",
            details: { field: "step_type" },
          },
          { status: 400 }
        );
      }
      updateData.step_type = step_type;
    }

    if (Object.keys(updateData).length === 0) {
      const { data: current } = await supabase
        .from("steps")
        .select("*")
        .eq("id", step_id)
        .single();
      if (!current) {
        return NextResponse.json({ error: "Step not found" }, { status: 404 });
      }
      return NextResponse.json({ step: current });
    }

    const { data: updated, error } = await supabase
      .from("steps")
      .update(updateData)
      .eq("id", step_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Step not found" }, { status: 404 });
      }
      console.error("[PATCH /api/admin/steps/[step_id]]", error);
      return NextResponse.json(
        { error: "Failed to update step" },
        { status: 500 }
      );
    }

    return NextResponse.json({ step: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/steps/[step_id]]", error);
    return NextResponse.json(
      { error: "Failed to update step" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/steps/[step_id]
 * Delete step only if not used by any product_steps.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id } = await params;

    const { data: usage, error: usageError } = await supabase
      .from("product_steps")
      .select("id")
      .eq("step_id", step_id)
      .limit(1);

    if (usageError) {
      console.error("[DELETE /api/admin/steps/[step_id]]", usageError);
      return NextResponse.json(
        { error: "Failed to check step usage" },
        { status: 500 }
      );
    }

    if (usage && usage.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cette step est utilisée dans des workflows et ne peut pas être supprimée.",
        },
        { status: 409 }
      );
    }

    const { error: deleteError } = await supabase
      .from("steps")
      .delete()
      .eq("id", step_id);

    if (deleteError) {
      console.error("[DELETE /api/admin/steps/[step_id]]", deleteError);
      return NextResponse.json(
        { error: "Failed to delete step" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/steps/[step_id]]", error);
    return NextResponse.json(
      { error: "Failed to delete step" },
      { status: 500 }
    );
  }
}
