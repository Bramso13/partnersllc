import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/dossiers/[id]/admin-steps
 * Fetch all admin step instances for a dossier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId } = await params;
    const supabase = createAdminClient();

    // Fetch step instances that are admin steps
    const { data: stepInstances, error: stepError } = await supabase
      .from("step_instances")
      .select(
        `
        id,
        step_id,
        dossier_id,
        started_at,
        completed_at,
        step:steps!inner (
          id,
          label,
          description,
          step_type
        )
      `
      )
      .eq("dossier_id", dossierId)
      .eq("steps.step_type", "ADMIN")
      .order("started_at", { ascending: true });

    if (stepError) {
      console.error("Error fetching admin steps:", stepError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des étapes admin" },
        { status: 500 }
      );
    }

    // Filter to ensure we only return admin steps (in case join didn't work as expected)
    const adminStepInstances = (stepInstances || []).filter((si) => {
      const step = Array.isArray(si.step) ? si.step[0] : si.step;
      return step && step.step_type === "ADMIN";
    });

    return NextResponse.json({
      stepInstances: adminStepInstances.map((si) => ({
        id: si.id,
        step_id: si.step_id,
        dossier_id: si.dossier_id,
        started_at: si.started_at,
        completed_at: si.completed_at,
        step: Array.isArray(si.step) ? si.step[0] : si.step,
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/admin/dossiers/[id]/admin-steps:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
