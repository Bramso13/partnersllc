import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/document-types/:id
 * Fetch a single document type by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("document_types")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching document type:", error);
      return NextResponse.json(
        { error: "Failed to fetch document type" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Document type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ documentType: data });
  } catch (error) {
    console.error("Error in GET /api/admin/document-types/:id:", error);
    return NextResponse.json(
      { error: "Failed to fetch document type" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/document-types/:id
 * Update a document type (partial update)
 * Code field is not modifiable
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const body = await request.json();
    const { label, description, max_file_size_mb, allowed_extensions } = body;

    // Explicitly reject any attempt to modify the code
    if ("code" in body) {
      return NextResponse.json(
        { error: "Code field cannot be modified" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (label !== undefined) {
      updateData.label = label;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (max_file_size_mb !== undefined) {
      updateData.max_file_size_mb = max_file_size_mb;
    }
    if (allowed_extensions !== undefined) {
      updateData.allowed_extensions = allowed_extensions;
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("document_types")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating document type:", error);
      return NextResponse.json(
        { error: "Failed to update document type" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Document type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ documentType: data });
  } catch (error) {
    console.error("Error in PATCH /api/admin/document-types/:id:", error);
    return NextResponse.json(
      { error: "Failed to update document type" },
      { status: 500 }
    );
  }
}
