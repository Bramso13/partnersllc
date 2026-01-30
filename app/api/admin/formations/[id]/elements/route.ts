import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CreateFormationElementRequest } from "@/types/formations";

/**
 * GET /api/admin/formations/[id]/elements
 * Fetch all elements for a formation (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id: formationId } = await params;

    const supabase = await createClient();

    const { data: elements, error } = await supabase
      .from("formation_elements")
      .select("*")
      .eq("formation_id", formationId)
      .order("position", { ascending: true });

    if (error) {
      console.error("[GET /api/admin/formations/[id]/elements] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch formation elements" },
        { status: 500 }
      );
    }

    return NextResponse.json({ elements: elements || [] });
  } catch (error) {
    console.error("[GET /api/admin/formations/[id]/elements] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch formation elements" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/formations/[id]/elements
 * Add a new element to a formation (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id: formationId } = await params;
    const body: CreateFormationElementRequest = await request.json();

    // Validate required fields
    if (!body.type || body.position === undefined || !body.payload) {
      return NextResponse.json(
        { error: "Missing required fields: type, position, and payload" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["video_link", "video_upload", "image", "rich_text"].includes(body.type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be: video_link, video_upload, image, or rich_text" },
        { status: 400 }
      );
    }

    // Validate position
    if (body.position < 1) {
      return NextResponse.json(
        { error: "Position must be >= 1" },
        { status: 400 }
      );
    }

    // Validate payload based on type
    if (body.type === "video_link") {
      const payload = body.payload as { url?: string };
      if (!payload.url) {
        return NextResponse.json(
          { error: "payload.url is required for video_link type" },
          { status: 400 }
        );
      }
    }

    if (body.type === "video_upload") {
      const payload = body.payload as { storage_path?: string };
      if (!payload.storage_path) {
        return NextResponse.json(
          { error: "payload.storage_path is required for video_upload type" },
          { status: 400 }
        );
      }
    }

    if (body.type === "image") {
      const payload = body.payload as { url?: string; storage_path?: string };
      if (!payload.url && !payload.storage_path) {
        return NextResponse.json(
          { error: "payload.url or payload.storage_path is required for image type" },
          { status: 400 }
        );
      }
    }

    if (body.type === "rich_text") {
      const payload = body.payload as { content?: string };
      if (!payload.content) {
        return NextResponse.json(
          { error: "payload.content is required for rich_text type" },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Check if formation exists
    const { data: formation, error: formationError } = await supabase
      .from("formations")
      .select("id")
      .eq("id", formationId)
      .single();

    if (formationError || !formation) {
      return NextResponse.json(
        { error: "Formation not found" },
        { status: 404 }
      );
    }

    // Create element
    const { data: element, error } = await supabase
      .from("formation_elements")
      .insert({
        formation_id: formationId,
        type: body.type,
        position: body.position,
        payload: body.payload,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An element already exists at this position. Please use a different position." },
          { status: 409 }
        );
      }

      console.error("[POST /api/admin/formations/[id]/elements] Error creating element:", error);
      return NextResponse.json(
        { error: "Failed to create formation element" },
        { status: 500 }
      );
    }

    return NextResponse.json({ element }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/formations/[id]/elements] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to create formation element" },
      { status: 500 }
    );
  }
}
