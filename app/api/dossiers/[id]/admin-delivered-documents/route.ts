import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/dossiers/[id]/admin-delivered-documents
 * Fetch documents manually delivered by admin (not tied to a step)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: dossierId } = await params;
    const supabase = await createClient();

    // Verify dossier belongs to user
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("id")
      .eq("id", dossierId)
      .eq("user_id", user.id)
      .single();

    if (dossierError || !dossier) {
      return NextResponse.json(
        { error: "Dossier non trouvé ou accès refusé" },
        { status: 404 }
      );
    }

    // Fetch documents where step_instance_id IS NULL and uploaded_by_type = 'AGENT'
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select(
        `
        id,
        document_type_id,
        created_at,
        current_version:document_versions!fk_current_version (
          id,
          file_name,
          file_size_bytes,
          uploaded_at,
          mime_type
        ),
        document_type:document_types (
          label,
          description
        )
      `
      )
      .eq("dossier_id", dossierId)
      .is("step_instance_id", null)
      .eq("status", "APPROVED")
      .order("created_at", { ascending: false });

    if (documentsError) {
      console.error("Error fetching admin-delivered documents:", documentsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des documents" },
        { status: 500 }
      );
    }

    // Filter to only include documents uploaded by agents
    // We need to check the document_versions to see if uploaded_by_type = 'AGENT'
    const { data: versions, error: versionsError } = await supabase
      .from("document_versions")
      .select("id, uploaded_by_type")
      .in(
        "id",
        (documents || [])
          .map((d) => {
            const currentVersion = Array.isArray(d.current_version)
              ? d.current_version[0]
              : d.current_version;
            return currentVersion?.id;
          })
          .filter(Boolean) as string[]
      );

    if (versionsError) {
      console.error("Error fetching document versions:", versionsError);
    }

    // Create a map of version IDs to uploaded_by_type
    const versionTypeMap = new Map(
      (versions || []).map((v) => [v.id, v.uploaded_by_type])
    );

    // Filter documents to only include those uploaded by agents
    const adminDeliveredDocuments = (documents || []).filter((doc) => {
      const currentVersion = Array.isArray(doc.current_version)
        ? doc.current_version[0]
        : doc.current_version;
      const versionId = currentVersion?.id;
      if (!versionId) return false;
      const uploadedByType = versionTypeMap.get(versionId);
      return uploadedByType === "AGENT";
    });

    return NextResponse.json({
      documents: adminDeliveredDocuments,
    });
  } catch (error) {
    console.error(
      "Error in GET /api/dossiers/[id]/admin-delivered-documents:",
      error
    );
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
