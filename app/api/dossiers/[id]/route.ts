import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getDossierById } from "@/lib/dossiers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const dossier = await getDossierById(id);

    if (!dossier) {
      return NextResponse.json(
        { message: "Dossier introuvable" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (dossier.user_id !== user.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json(dossier);
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération du dossier",
      },
      { status: 500 }
    );
  }
}
