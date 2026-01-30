import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CreateFormationRequest } from "@/types/formations";

/**
 * GET /api/admin/formations
 * Fetch all formations (admin only)
 */
export async function GET() {
  try {
    await requireAdminAuth();

    const supabase = await createClient();

    const { data: formations, error } = await supabase
      .from("formations")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[GET /api/admin/formations] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch formations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ formations: formations || [] });
  } catch (error) {
    console.error("[GET /api/admin/formations] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch formations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/formations
 * Create a new formation (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body: CreateFormationRequest = await request.json();

    // Validate required fields
    if (!body.titre || !body.visibility_type) {
      return NextResponse.json(
        { error: "Missing required fields: titre and visibility_type" },
        { status: 400 }
      );
    }

    // Validate visibility_type
    if (!["all", "by_product_ids", "by_dossier_type"].includes(body.visibility_type)) {
      return NextResponse.json(
        { error: "Invalid visibility_type. Must be: all, by_product_ids, or by_dossier_type" },
        { status: 400 }
      );
    }

    // Validate visibility_config based on type
    if (body.visibility_type === "by_product_ids") {
      const config = body.visibility_config as { product_ids?: string[] };
      if (!config?.product_ids || !Array.isArray(config.product_ids) || config.product_ids.length === 0) {
        return NextResponse.json(
          { error: "visibility_config.product_ids is required and must be a non-empty array for by_product_ids type" },
          { status: 400 }
        );
      }
    }

    if (body.visibility_type === "by_dossier_type") {
      const config = body.visibility_config as { dossier_type?: string };
      if (!config?.dossier_type) {
        return NextResponse.json(
          { error: "visibility_config.dossier_type is required for by_dossier_type type" },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Create formation
    const { data: formation, error } = await supabase
      .from("formations")
      .insert({
        titre: body.titre,
        description: body.description || null,
        vignette_url: body.vignette_url || null,
        vignette_path: body.vignette_path || null,
        visibility_type: body.visibility_type,
        visibility_config: body.visibility_config || {},
        display_order: body.display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/admin/formations] Error creating formation:", error);
      return NextResponse.json(
        { error: "Failed to create formation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ formation }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/formations] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to create formation" },
      { status: 500 }
    );
  }
}
