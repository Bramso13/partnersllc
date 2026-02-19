import { NextRequest, NextResponse } from "next/server";
import { getOrCreateStepInstance } from "@/lib/modules/workflow/client";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const dossierId = searchParams.get("dossier_id");
    const stepId = searchParams.get("step_id");

    if (!dossierId || !stepId) {
      return NextResponse.json(
        { message: "dossier_id et step_id sont requis" },
        { status: 400 }
      );
    }

    const stepInstance = await getOrCreateStepInstance(user.id, dossierId, stepId);

    if (!stepInstance) {
      return NextResponse.json(
        { message: "Dossier introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(stepInstance);
  } catch (error) {
    console.error("Error fetching step instance:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération de l'instance",
      },
      { status: 500 }
    );
  }
}
