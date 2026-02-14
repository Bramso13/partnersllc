import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    const supabase = createAdminClient();

    const { data: stepInstances, error } = await supabase
      .from("step_instances")
      .select(
        `
        id,
        step_id,
        dossier_id,
        started_at,
        completed_at,
        validation_status,
        step:steps(id, label, step_type)
      `
      )
      .eq("dossier_id", dossierId)
      .order("started_at", { ascending: true });

    if (error) {
      console.error("[GET step-instances] Error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des étapes" },
        { status: 500 }
      );
    }

    const steps = (stepInstances || []).map((si) => ({
      id: si.id,
      step_id: si.step_id,
      dossier_id: si.dossier_id,
      started_at: si.started_at,
      completed_at: si.completed_at,
      validation_status: si.validation_status ?? "PENDING",
      step: Array.isArray(si.step) ? si.step[0] : si.step,
    }));

    return NextResponse.json({ stepInstances: steps });
  } catch (err) {
    console.error("[GET step-instances] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
