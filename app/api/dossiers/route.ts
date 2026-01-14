import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserDossiers } from "@/lib/dossiers";

export async function GET() {
  try {
    const user = await requireAuth();
    const dossiers = await getUserDossiers();
    return NextResponse.json(dossiers);
  } catch (error) {
    console.error("Error fetching dossiers:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération des dossiers",
      },
      { status: 500 }
    );
  }
}
