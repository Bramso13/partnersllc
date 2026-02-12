import { NextRequest, NextResponse } from "next/server";
import { requireClientAuth } from "@/lib/auth";
import { getStepFormationCustomForUser } from "@/lib/formations";
import type { GetStepFormationCustomResponse } from "@/types/formations";

/**
 * GET /api/formations/step-custom/[id]
 * Return a custom formation (title, html_content) if the user has access to its step.
 * Used by the step-custom formation page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireClientAuth();
    const { id } = await params;

    const custom = await getStepFormationCustomForUser(id, profile.id);

    if (!custom) {
      return NextResponse.json(
        { error: "Formation custom introuvable ou accès non autorisé" },
        { status: 404 }
      );
    }

    const response: GetStepFormationCustomResponse = {
      id: custom.id,
      step_id: custom.step_id,
      title: custom.title,
      html_content: custom.html_content,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/formations/step-custom/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch custom formation" },
      { status: 500 }
    );
  }
}
