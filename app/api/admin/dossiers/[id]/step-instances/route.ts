import { requireAdminAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getByDossierId } from "@/lib/modules/dossiers/admin/step-instances";

/**
 * GET /api/admin/dossiers/[id]/step-instances
 * Retourne toutes les step instances du dossier (pour la vue d'observation test).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId } = await params;

    const steps = await getByDossierId(dossierId);

    return NextResponse.json({ stepInstances: steps });
  } catch (err) {
    console.error("[GET step-instances] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
