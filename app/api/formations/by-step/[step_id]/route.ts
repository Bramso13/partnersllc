import { NextRequest, NextResponse } from "next/server";
import { requireClientAuth } from "@/lib/auth";
import { getFormationsByStepForUser } from "@/lib/formations";
import type { GetFormationsByStepResponse } from "@/types/formations";

/**
 * GET /api/formations/by-step/[step_id]
 * Return formations linked to this step that are accessible to the current client (visibility rules).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    const profile = await requireClientAuth();
    const { step_id } = await params;

    const formations = await getFormationsByStepForUser(step_id, profile.id);

    const response: GetFormationsByStepResponse = {
      formations: formations.map((f) => ({
        id: f.id,
        titre: f.titre,
        description: f.description ?? null,
        vignette_url: f.vignette_url ?? null,
      })),
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
