import { NextRequest, NextResponse } from "next/server";
import { resubmitStep } from "@/lib/modules/workflow/client";
import { requireAuth } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { step_instance_id, corrected_fields } = body;

    if (!step_instance_id || !corrected_fields) {
      return NextResponse.json(
        { message: "step_instance_id et corrected_fields sont requis" },
        { status: 400 }
      );
    }

    const result = await resubmitStep(user.id, step_instance_id, corrected_fields);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Resubmission error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la soumission des corrections",
      },
      { status: 500 }
    );
  }
}
