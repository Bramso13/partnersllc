import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/backoffice/dossier-summary/[id]
 * Returns a dossier summary including step_instances_count and documents_count
 * for the reset tab preview.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId } = await params;

    const supabase = createAdminClient();

    const { data: dossier, error } = await supabase
      .from("dossiers")
      .select(
        `id, status, created_at, metadata, user_id, product_id, current_step_instance_id,
         profiles!user_id(id, full_name),
         products(id, name)`
      )
      .eq("id", dossierId)
      .single();

    if (error || !dossier) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    // Count step instances
    const { count: stepInstancesCount } = await supabase
      .from("step_instances")
      .select("id", { count: "exact", head: true })
      .eq("dossier_id", dossierId);

    // Count documents
    const { count: documentsCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("dossier_id", dossierId);

    const profile = Array.isArray(dossier.profiles) ? dossier.profiles[0] : dossier.profiles;
    const product = Array.isArray(dossier.products) ? dossier.products[0] : dossier.products;

    return NextResponse.json({
      dossier: {
        id: dossier.id,
        status: dossier.status,
        created_at: dossier.created_at,
        metadata: dossier.metadata,
        user_id: dossier.user_id,
        product_id: dossier.product_id,
        current_step_instance_id: dossier.current_step_instance_id,
        client: profile ?? null,
        product: product ?? null,
        step_instances_count: stepInstancesCount ?? 0,
        documents_count: documentsCount ?? 0,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/backoffice/dossier-summary]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
