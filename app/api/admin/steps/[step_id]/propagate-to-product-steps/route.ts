import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/steps/[step_id]/propagate-to-product-steps
 * Propagate step.position to all product_steps that reference this step.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id } = await params;

    const { data: step, error: stepError } = await supabase
      .from("steps")
      .select("id, position")
      .eq("id", step_id)
      .single();

    if (stepError || !step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("product_steps")
      .update({ position: step.position })
      .eq("step_id", step_id)
      .select("id");

    if (updateError) {
      console.error("[POST propagate-to-product-steps]", updateError);
      return NextResponse.json(
        { error: "Failed to propagate step changes" },
        { status: 500 }
      );
    }

    const updatedCount = updated?.length ?? 0;

    return NextResponse.json({
      success: true,
      updatedCount,
    });
  } catch (error) {
    console.error("[POST propagate-to-product-steps]", error);
    return NextResponse.json(
      { error: "Failed to propagate step changes" },
      { status: 500 }
    );
  }
}
