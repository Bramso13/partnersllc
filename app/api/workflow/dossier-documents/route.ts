import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const dossierId = searchParams.get("dossier_id");
    const stepInstanceId = searchParams.get("step_instance_id");

    console.log("[dossier-documents] Request params:", {
      dossierId,
      stepInstanceId,
      userId: user.id,
    });

    if (!dossierId) {
      return NextResponse.json(
        { error: "dossier_id is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify dossier belongs to user
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("id")
      .eq("id", dossierId)
      .eq("user_id", user.id)
      .single();

    console.log("[dossier-documents] Dossier verification:", {
      dossier,
      dossierError,
    });

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
          uploaded_at,
          uploaded_by_type
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
      documents,
    });

    if (error) {
      console.error("[dossier-documents] Error fetching documents:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    // Return documents with current_version structure for compatibility
    // Filter to include all documents (both user-uploaded and admin-delivered)
    const mappedDocs = (documents || [])
      .filter((doc: any) => {
        // Only include documents that have a current_version
        return doc.current_version !== null && doc.current_version !== undefined;
      })
      .map((doc: any) => {
        const currentVersion = doc.current_version;
        return {
          id: doc.id,
          document_type_id: doc.document_type_id,
          status: doc.status,
          step_instance_id: doc.step_instance_id,
          created_at: doc.created_at,
          // Keep both formats for backward compatibility
          file_name: currentVersion?.file_name || "",
          file_url: currentVersion?.file_url || "",
          current_version: currentVersion
            ? {
                id: currentVersion.id,
                file_name: currentVersion.file_name,
                file_url: currentVersion.file_url,
                file_size_bytes: currentVersion.file_size_bytes,
                uploaded_at: currentVersion.uploaded_at,
                uploaded_by_type: currentVersion.uploaded_by_type,
              }
            : null,
        };
      });

    console.log("[dossier-documents] Mapped documents:", mappedDocs);

    return NextResponse.json(mappedDocs);
  } catch (error) {
    console.error("Error in dossier-documents:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch documents",
      },
      { status: 500 }
    );
  }
}
