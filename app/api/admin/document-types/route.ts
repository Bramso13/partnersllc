import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/document-types
 * Fetch all available document types
 */
export async function GET() {
  try {
    await requireAdminAuth();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("document_types")
      .select("*")
      .order("label");

    if (error) {
      console.error("Error fetching document types:", error);
      return NextResponse.json(
        { error: "Failed to fetch document types" },
        { status: 500 }
      );
    }

    return NextResponse.json({ documentTypes: data });
  } catch (error) {
    console.error("Error in GET /api/admin/document-types:", error);
    return NextResponse.json(
      { error: "Failed to fetch document types" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/document-types
 * Create a new document type
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const { code, label, description, max_file_size_mb, allowed_extensions } =
      body;

    // Validation
    if (!code || !label) {
      return NextResponse.json(
        { error: "Code and label are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("document_types")
      .insert({
        code,
        label,
        description: description || null,
        max_file_size_mb: max_file_size_mb || 10,
        allowed_extensions: allowed_extensions || ["pdf", "jpg", "png"],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document type:", error);
      return NextResponse.json(
        { error: "Failed to create document type" },
        { status: 500 }
      );
    }

    return NextResponse.json({ documentType: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/document-types:", error);
    return NextResponse.json(
      { error: "Failed to create document type" },
      { status: 500 }
    );
  }
}
