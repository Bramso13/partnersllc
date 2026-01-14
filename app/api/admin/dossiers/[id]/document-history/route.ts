import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAdminAuth();
    const { id: dossierId } = await params;

    const supabase = await createClient();

    // Fetch documents for this dossier
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("id, document_type_id")
      .eq("dossier_id", dossierId);

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all document versions for these documents
    const documentIds = documents.map((d) => d.id);
    const { data: versions, error: versionsError } = await supabase
      .from("document_versions")
      .select("*")
      .in("document_id", documentIds)
      .order("uploaded_at", { ascending: false });

    if (versionsError) {
      console.error("Error fetching document versions:", versionsError);
      return NextResponse.json(
        { error: "Failed to fetch document versions" },
        { status: 500 }
      );
    }

    // Fetch reviews for all versions
    const versionIds = (versions || []).map((v) => v.id);
    const { data: reviews, error: reviewsError } = await supabase
      .from("document_reviews")
      .select(
        `
        id,
        document_version_id,
        status,
        reason,
        reviewed_at,
        reviewed_by_id,
        agents:reviewed_by_id (
          name
        )
      `
      )
      .in("document_version_id", versionIds);

    if (reviewsError) {
      console.error("Error fetching document reviews:", reviewsError);
    }

    // Fetch document type labels
    const documentTypeIds = [...new Set(documents.map((d) => d.document_type_id))];
    const { data: documentTypes } = await supabase
      .from("document_types")
      .select("id, label")
      .in("id", documentTypeIds);

    const documentTypeMap = new Map(
      (documentTypes || []).map((dt: any) => [dt.id, dt.label])
    );

    // Group reviews by version
    const reviewsByVersion = new Map<string, any[]>();
    (reviews || []).forEach((review: any) => {
      const versionId = review.document_version_id;
      if (!reviewsByVersion.has(versionId)) {
        reviewsByVersion.set(versionId, []);
      }
      reviewsByVersion.get(versionId)!.push({
        id: review.id,
        status: review.status,
        reason: review.reason,
        reviewed_at: review.reviewed_at,
        reviewed_by_id: review.reviewed_by_id,
        reviewer_name: review.agents?.name || "Agent inconnu",
      });
    });

    // Build response with versions and their reviews
    const documentMap = new Map(documents.map((d) => [d.id, d]));
    const enrichedVersions = (versions || []).map((version: any) => {
      const document = documentMap.get(version.document_id);
      const documentTypeLabel = document
        ? documentTypeMap.get(document.document_type_id)
        : null;

      return {
        id: version.id,
        document_id: version.document_id,
        version_number: version.version_number,
        file_url: version.file_url,
        uploaded_at: version.uploaded_at,
        uploaded_by_id: version.uploaded_by_id,
        document_type_label: documentTypeLabel || "Document",
        reviews: reviewsByVersion.get(version.id) || [],
      };
    });

    return NextResponse.json(enrichedVersions);
  } catch (error) {
    console.error("Error in GET document-history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
