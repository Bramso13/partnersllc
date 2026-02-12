import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import type {
  GetStepFormationsCustomResponse,
  PostStepFormationCustomRequest,
} from "@/types/formations";

const PostBodySchema = z.object({
  title: z.string().min(1, "title is required"),
  html_content: z.string(),
  position: z.number().int().min(0).optional(),
});

/**
 * GET /api/admin/steps/[step_id]/formations-custom
 * Return custom formations for this step. Admin only.
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
      .from("step_formation_custom")
      .select("id, step_id, position, title, html_content")
      .eq("step_id", step_id)
      .order("position", { ascending: true });

    if (error) {
      console.error("[GET /api/admin/steps/[step_id]/formations-custom]", error);
      return NextResponse.json(
        { error: "Failed to fetch step custom formations" },
        { status: 500 }
      );
    }

    const response: GetStepFormationsCustomResponse = {
      formations: (data ?? []) as GetStepFormationsCustomResponse["formations"],
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "[GET /api/admin/steps/[step_id]/formations-custom]",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch step custom formations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/steps/[step_id]/formations-custom
 * Create a custom formation for this step. Admin only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id } = await params;

    const body = await request.json();
    const parsed = PostBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, html_content, position } = parsed.data as PostStepFormationCustomRequest;

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

    const positionValue = position ?? 0;

    const { data: inserted, error: insertError } = await supabase
      .from("step_formation_custom")
      .insert({
        step_id,
        title,
        html_content: html_content ?? "",
        position: positionValue,
      })
      .select("id, step_id, position, title, html_content")
      .single();

    if (insertError) {
      console.error(
        "[POST /api/admin/steps/[step_id]/formations-custom]",
        insertError
      );
      return NextResponse.json(
        { error: "Failed to create custom formation" },
        { status: 500 }
      );
    }

    return NextResponse.json(inserted);
  } catch (error) {
    console.error(
      "[POST /api/admin/steps/[step_id]/formations-custom]",
      error
    );
    return NextResponse.json(
      { error: "Failed to create custom formation" },
      { status: 500 }
    );
  }
}
