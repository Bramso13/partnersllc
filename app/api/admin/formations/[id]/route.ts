import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFormationWithElements } from "@/lib/formations";
import type { UpdateFormationRequest } from "@/types/formations";

/**
 * GET /api/admin/formations/[id]
 * Fetch a single formation with elements (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id: formationId } = await params;

    const formation = await getFormationWithElements(formationId, false);

    if (!formation) {
      return NextResponse.json(
        { error: "Formation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ formation });
  } catch (error) {
    console.error("[GET /api/admin/formations/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch formation" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/formations/[id]
 * Update a formation (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id: formationId } = await params;
    const body: UpdateFormationRequest = await request.json();

    // Validate visibility_type if provided
    if (body.visibility_type && !["all", "by_product_ids", "by_dossier_type"].includes(body.visibility_type)) {
      return NextResponse.json(
        { error: "Invalid visibility_type. Must be: all, by_product_ids, or by_dossier_type" },
        { status: 400 }
      );
    }

    // Validate visibility_config based on type if both are provided
    if (body.visibility_type === "by_product_ids" && body.visibility_config) {
      const config = body.visibility_config as { product_ids?: string[] };
      if (!config?.product_ids || !Array.isArray(config.product_ids) || config.product_ids.length === 0) {
        return NextResponse.json(
          { error: "visibility_config.product_ids is required and must be a non-empty array for by_product_ids type" },
          { status: 400 }
        );
      }
    }

    if (body.visibility_type === "by_dossier_type" && body.visibility_config) {
      const config = body.visibility_config as { dossier_type?: string };
      if (!config?.dossier_type) {
        return NextResponse.json(
          { error: "visibility_config.dossier_type is required for by_dossier_type type" },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (body.titre !== undefined) updateData.titre = body.titre;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.vignette_url !== undefined) updateData.vignette_url = body.vignette_url;
    if (body.vignette_path !== undefined) updateData.vignette_path = body.vignette_path;
    if (body.visibility_type !== undefined) updateData.visibility_type = body.visibility_type;
    if (body.visibility_config !== undefined) updateData.visibility_config = body.visibility_config;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;

    // Update formation
    const { data: formation, error } = await supabase
      .from("formations")
      .update(updateData)
      .eq("id", formationId)
      .select()
      .single();

    if (error) {
      console.error("[PUT /api/admin/formations/[id]] Error updating formation:", error);
      return NextResponse.json(
        { error: "Failed to update formation" },
        { status: 500 }
      );
    }

    if (!formation) {
      return NextResponse.json(
        { error: "Formation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ formation });
  } catch (error) {
    console.error("[PUT /api/admin/formations/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to update formation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/formations/[id]
 * Delete a formation (admin only)
 * Note: Elements will be cascade deleted due to foreign key constraint
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id: formationId } = await params;

    const supabase = await createClient();

    // Check if formation exists
    const { data: formation, error: checkError } = await supabase
      .from("formations")
      .select("id")
      .eq("id", formationId)
      .single();

    if (checkError || !formation) {
      return NextResponse.json(
        { error: "Formation not found" },
        { status: 404 }
      );
    }

    // Delete formation (cascade will delete elements and progress)
    const { error: deleteError } = await supabase
      .from("formations")
      .delete()
      .eq("id", formationId);

    if (deleteError) {
      console.error("[DELETE /api/admin/formations/[id]] Error deleting formation:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete formation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/formations/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to delete formation" },
      { status: 500 }
    );
  }
}
