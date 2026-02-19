import { NextRequest, NextResponse } from "next/server";
import { getDossierDocuments } from "@/lib/modules/workflow/client";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const dossierId = searchParams.get("dossier_id");
    const stepInstanceId = searchParams.get("step_instance_id");

    if (!dossierId) {
      return NextResponse.json(
        { error: "dossier_id is required" },
        { status: 400 }
      );
    }

    const documents = await getDossierDocuments(
      user.id,
      dossierId,
      stepInstanceId || undefined
    );

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error in dossier-documents:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch documents",
      },
      { status: 500 }
    );
  }
}
