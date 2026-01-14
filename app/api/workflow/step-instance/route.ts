import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const dossierId = searchParams.get("dossier_id");
    const stepId = searchParams.get("step_id");

    if (!dossierId || !stepId) {
      return NextResponse.json(
        { message: "dossier_id et step_id sont requis" },
        { status: 400 }
      );
    }

    // Verify dossier ownership
    const { data: dossier } = await supabase
      .from("dossiers")
      .select("id, user_id")
      .eq("id", dossierId)
      .eq("user_id", user.id)
      .single();

    if (!dossier) {
      return NextResponse.json(
        { message: "Dossier introuvable" },
        { status: 404 }
      );
    }

    // Get step instance
    const { data: stepInstance, error } = await supabase
      .from("step_instances")
      .select("id, validation_status, rejection_reason")
      .eq("dossier_id", dossierId)
      .eq("step_id", stepId)
      .single();

    if (error || !stepInstance) {
      // Step instance doesn't exist yet - create one in DRAFT status
      const { data: newInstance, error: createError } = await supabase
        .from("step_instances")
        .insert({
          dossier_id: dossierId,
          step_id: stepId,
          started_at: new Date().toISOString(),
          validation_status: "DRAFT",
        })
        .select("id, validation_status, rejection_reason")
        .single();

      if (createError || !newInstance) {
        console.error("Error creating step instance:", createError);
        return NextResponse.json(null, { status: 200 });
      }

      return NextResponse.json(newInstance);
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
