import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/dossiers/[dossierId]/documents/[documentId]/clear-version
 * Met current_version_id à null pour le document (suppression logique).
 * Réservé aux admins. Les lignes document_versions ne sont pas supprimées (audit conservé).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; document_id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId, document_id: documentId } = await params;
    const supabase = createAdminClient();

    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, dossier_id, step_instance_id")
      .eq("id", documentId)
      .eq("dossier_id", dossierId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({ current_version_id: null })
      .eq("id", documentId)
      .eq("dossier_id", dossierId);

    if (updateError) {
      console.error("Admin clear-version error:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression de la version courante" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin document clear-version error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
