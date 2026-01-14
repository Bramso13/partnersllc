import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const dossierId = searchParams.get("dossier_id");
    const stepInstanceId = searchParams.get("step_instance_id");

    console.log("[dossier-documents] Request params:", { dossierId, stepInstanceId, userId: user.id });

    if (!dossierId) {
      return NextResponse.json(
        { error: "dossier_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify dossier belongs to user
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("id")
      .eq("id", dossierId)
      .eq("user_id", user.id)
      .single();

    console.log("[dossier-documents] Dossier verification:", { dossier, dossierError });

    if (dossierError || !dossier) {
      console.log("[dossier-documents] Dossier not found or access denied");
      return NextResponse.json(
        { error: "Dossier not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch documents for this dossier
    let query = supabase
      .from("documents")
      .select(
        `
        id,
        document_type_id,
        status,
        step_instance_id,
        created_at,
        current_version:document_versions!fk_current_version (
          id,
          file_url,
          file_name,
          file_size_bytes,
          uploaded_at
        )
      `
      )
      .eq("dossier_id", dossierId);

    if (stepInstanceId) {
      query = query.eq("step_instance_id", stepInstanceId);
    }

    const { data: documents, error } = await query;

    console.log("[dossier-documents] Documents query result:", {
      count: documents?.length || 0,
      error,
      documents
    });

    if (error) {
      console.error("[dossier-documents] Error fetching documents:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    // Map to simpler structure
    const mappedDocs = (documents || []).map((doc: any) => ({
      id: doc.id,
      document_type_id: doc.document_type_id,
      status: doc.status,
      file_name: doc.current_version?.file_name || "",
      file_url: doc.current_version?.file_url || "",
      created_at: doc.created_at,
    }));

    console.log("[dossier-documents] Mapped documents:", mappedDocs);

    return NextResponse.json(mappedDocs);
  } catch (error) {
    console.error("Error in dossier-documents:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch documents",
      },
      { status: 500 }
    );
  }
}
