import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/dossiers/[id]/status-history
 * Retourne l'historique des changements de statut du dossier.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId } = await params;

    const supabase = createAdminClient();

    const { data: history, error } = await supabase
      .from("dossier_status_history")
      .select(
        `
        id,
        old_status,
        new_status,
        changed_by_type,
        changed_by_id,
        reason,
        created_at
      `
      )
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET status-history] Error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération de l'historique" },
        { status: 500 }
      );
    }

    return NextResponse.json({ statusHistory: history ?? [] });
  } catch (err) {
    console.error("[GET status-history] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
