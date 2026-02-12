import { NextRequest, NextResponse } from "next/server";
import { requireClientAuth } from "@/lib/auth";
import {
  getFormationsByStepForUser,
  getStepFormationsCustom,
} from "@/lib/formations";
import type {
  GetFormationsByStepResponse,
  GetFormationsByStepResponseV2,
  StepFormationItem,
} from "@/types/formations";

/**
 * GET /api/formations/by-step/[step_id]
 * Return formations linked to this step (accessible to the client) and custom formations (Story 12.5).
 * Response includes formations, formations_custom, and a unified items list for display order.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    const profile = await requireClientAuth();
    const { step_id } = await params;

    const [formations, customs] = await Promise.all([
      getFormationsByStepForUser(step_id, profile.id),
      getStepFormationsCustom(step_id),
    ]);

    const formationSummaries = formations.map((f) => ({
      id: f.id,
      titre: f.titre,
      description: f.description ?? null,
      vignette_url: f.vignette_url ?? null,
    }));

    const items: StepFormationItem[] = [
      ...formationSummaries.map(
        (f): StepFormationItem => ({
          type: "formation",
          id: f.id,
          titre: f.titre,
          url: `/dashboard/formation/${f.id}`,
        })
      ),
      ...customs.map(
        (c): StepFormationItem => ({
          type: "custom",
          id: c.id,
          title: c.title,
          url: `/dashboard/formation/step-custom/${c.id}`,
        })
      ),
    ];

    const response: GetFormationsByStepResponse & GetFormationsByStepResponseV2 = {
      formations: formationSummaries,
      formations_custom: customs,
      items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/formations/by-step/[step_id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch formations for step" },
      { status: 500 }
    );
  }
}
