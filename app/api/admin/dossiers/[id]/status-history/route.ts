import { requireAdminAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getStatusHistory } from "@/lib/modules/dossiers/admin";

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

    const statusHistory = await getStatusHistory(dossierId);

    return NextResponse.json({ statusHistory });
  } catch (err) {
    console.error("[GET status-history] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
