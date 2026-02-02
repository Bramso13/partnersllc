import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/steps/[step_id]/document-types
 * List document types linked to this step (step_document_types with document_type)
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
      .from("step_document_types")
      .select(
        `
        id,
        step_id,
        document_type_id,
        document_type:document_types(*)
      `
      )
      .eq("step_id", step_id);

    if (error) {
      console.error("[GET /api/admin/steps/[step_id]/document-types]", error);
      return NextResponse.json(
        { error: "Failed to fetch step document types" },
        { status: 500 }
      );
    }

    const items = (data ?? []).map((row) => ({
      id: row.id,
      step_id: row.step_id,
      document_type_id: row.document_type_id,
      document_type: Array.isArray(row.document_type)
        ? row.document_type[0]
        : row.document_type,
    }));

    return NextResponse.json({ document_types: items });
  } catch (error) {
    console.error("[GET /api/admin/steps/[step_id]/document-types]", error);
    return NextResponse.json(
      { error: "Failed to fetch step document types" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/steps/[step_id]/document-types
 * Add a document type to this step. Body: { document_type_id }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id } = await params;
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || !("document_type_id" in body)) {
      return NextResponse.json(
        { error: "document_type_id is required" },
        { status: 400 }
      );
    }

    const document_type_id = (body as { document_type_id: string })
      .document_type_id;
    if (!document_type_id || typeof document_type_id !== "string") {
      return NextResponse.json(
        { error: "document_type_id must be a non-empty string" },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabase
      .from("step_document_types")
      .insert({ step_id, document_type_id })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Ce type de document est déjà associé à cette step" },
          { status: 409 }
        );
      }
      console.error("[POST /api/admin/steps/[step_id]/document-types]", error);
      return NextResponse.json(
        { error: "Failed to add document type to step" },
        { status: 500 }
      );
    }

    return NextResponse.json({ step_document_type: inserted }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/steps/[step_id]/document-types]", error);
    return NextResponse.json(
      { error: "Failed to add document type to step" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/steps/[step_id]/document-types
 * Remove a document type from this step. Body: { document_type_id } or query: document_type_id=
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const { step_id } = await params;

    let document_type_id: string | null = null;
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      try {
        const body: unknown = await request.json();
        if (body && typeof body === "object" && "document_type_id" in body) {
          document_type_id = (body as { document_type_id: string })
            .document_type_id;
        }
      } catch {
        // ignore
      }
    }
    if (!document_type_id) {
      document_type_id = request.nextUrl.searchParams.get("document_type_id");
    }
    if (!document_type_id) {
      return NextResponse.json(
        { error: "document_type_id is required (body or query)" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("step_document_types")
      .delete()
      .eq("step_id", step_id)
      .eq("document_type_id", document_type_id);

    if (deleteError) {
      console.error(
        "[DELETE /api/admin/steps/[step_id]/document-types]",
        deleteError
      );
      return NextResponse.json(
        { error: "Failed to remove document type from step" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/steps/[step_id]/document-types]", error);
    return NextResponse.json(
      { error: "Failed to remove document type from step" },
      { status: 500 }
    );
  }
}
