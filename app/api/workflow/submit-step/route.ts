import { NextRequest, NextResponse } from "next/server";
import { submitStep } from "@/lib/modules/workflow/client";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { dossier_id, step_id, field_values } = body;

    if (!dossier_id || !step_id || !field_values) {
      return NextResponse.json(
        { message: "dossier_id, step_id et field_values sont requis" },
        { status: 400 }
      );
    }

    const result = await submitStep(user.id, dossier_id, step_id, field_values);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la soumission de l'étape",
      },
      { status: 500 }
    );
  }
}
