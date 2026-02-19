import { requireAdminAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getDossierEvents } from "@/lib/modules/dossiers/admin";

/**
 * GET /api/admin/dossiers/[id]/events
 * Retourne TOUS les événements liés au dossier :
 * - entity_type dossier / DOSSIER (entity_id = dossierId)
 * - entity_type step_instance / STEP_INSTANCE (entity_id = step_instance du dossier)
 * - entity_type document (entity_id = document du dossier)
 * - events avec payload.dossier_id = dossierId (DOCUMENT_DELIVERED, etc.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId } = await params;

    const events = await getDossierEvents(dossierId);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error in GET events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
