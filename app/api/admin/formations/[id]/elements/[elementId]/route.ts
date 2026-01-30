import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UpdateFormationElementRequest } from "@/types/formations";

/**
 * PUT /api/admin/formations/[id]/elements/[elementId]
 * Update a formation element (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; elementId: string }> }
) {
  try {
    await requireAdminAuth();

    const { id: formationId, elementId } = await params;
    const body: UpdateFormationElementRequest = await request.json();

    // Validate type if provided
    if (body.type && !["video_link", "video_upload", "image", "rich_text"].includes(body.type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be: video_link, video_upload, image, or rich_text" },
        { status: 400 }
      );
    }

    // Validate position if provided
    if (body.position !== undefined && body.position < 1) {
      return NextResponse.json(
        { error: "Position must be >= 1" },
        { status: 400 }
      );
    }

    // Validate payload based on type if both are provided
    if (body.type && body.payload) {
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
    }

    const supabase = await createClient();

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (body.type !== undefined) updateData.type = body.type;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.payload !== undefined) updateData.payload = body.payload;

    // Update element
    const { data: element, error } = await supabase
      .from("formation_elements")
      .update(updateData)
      .eq("id", elementId)
      .eq("formation_id", formationId) // Ensure element belongs to this formation
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

      console.error("[PUT /api/admin/formations/[id]/elements/[elementId]] Error updating element:", error);
      return NextResponse.json(
        { error: "Failed to update formation element" },
        { status: 500 }
      );
    }

    if (!element) {
      return NextResponse.json(
        { error: "Element not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ element });
  } catch (error) {
    console.error("[PUT /api/admin/formations/[id]/elements/[elementId]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to update formation element" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/formations/[id]/elements/[elementId]
 * Delete a formation element (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; elementId: string }> }
) {
  try {
    await requireAdminAuth();

    const { id: formationId, elementId } = await params;

    const supabase = await createClient();

    // Check if element exists and belongs to this formation
    const { data: element, error: checkError } = await supabase
      .from("formation_elements")
      .select("id")
      .eq("id", elementId)
      .eq("formation_id", formationId)
      .single();

    if (checkError || !element) {
      return NextResponse.json(
        { error: "Element not found" },
        { status: 404 }
      );
    }

    // Delete element
    const { error: deleteError } = await supabase
      .from("formation_elements")
      .delete()
      .eq("id", elementId);

    if (deleteError) {
      console.error("[DELETE /api/admin/formations/[id]/elements/[elementId]] Error deleting element:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete formation element" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/formations/[id]/elements/[elementId]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to delete formation element" },
      { status: 500 }
    );
  }
}
