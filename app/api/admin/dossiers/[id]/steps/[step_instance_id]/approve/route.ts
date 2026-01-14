import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get or create agent for user
async function getOrCreateAgent(userId: string, userName: string, userEmail: string) {
  const supabase = await createAdminClient();
  
  // Try to find existing agent by email
  const { data: agent, error } = await supabase
    .from("agents")
    .select("id")
    .eq("email", userEmail)
    .single();

  // If agent doesn't exist, create one
  if (error || !agent) {
    const { data: newAgent, error: createError } = await supabase
      .from("agents")
      .insert({
        email: userEmail,
        name: userName,
        active: true,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating agent:", createError);
      throw new Error("Impossible de créer l'agent");
    }

    return newAgent.id;
  }

  return agent.id;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; step_instance_id: string }> }
) {
  try {
    const profile = await requireAdminAuth();
    const { id: dossierId, step_instance_id } = await params;

    // Get or create agent ID for this user
    const agentId = await getOrCreateAgent(
      profile.id, 
      profile.full_name ?? '', 
      profile.email ?? ''
    );

    const supabase = await createAdminClient();

    // Verify the step instance belongs to this dossier
    const { data: stepInstance, error: verifyError } = await supabase
      .from("step_instances")
      .select("id, dossier_id, validation_status")
      .eq("id", step_instance_id)
      .single();

    if (verifyError || !stepInstance) {
      return NextResponse.json(
        { error: "Étape non trouvée" },
        { status: 404 }
      );
    }

    if (stepInstance.dossier_id !== dossierId) {
      return NextResponse.json(
        { error: "Étape non autorisée pour ce dossier" },
        { status: 403 }
      );
    }

    // Verify all fields are APPROVED
    const { data: fields, error: fieldsError } = await supabase
      .from("step_field_values")
      .select("id, validation_status")
      .eq("step_instance_id", step_instance_id);

    if (fieldsError) {
      console.error("Error checking fields:", fieldsError);
      return NextResponse.json(
        { error: "Erreur lors de la vérification des champs" },
        { status: 500 }
      );
    }

    const allFieldsApproved = fields.every(
      (field) => field.validation_status === "APPROVED"
    );

    if (!allFieldsApproved) {
      return NextResponse.json(
        { error: "Tous les champs doivent être approuvés avant de valider l'étape" },
        { status: 400 }
      );
    }

    // Update step instance to APPROVED
    const { data: updatedStep, error: updateError } = await supabase
      .from("step_instances")
      .update({
        validation_status: "APPROVED",
        validated_by: agentId,
        validated_at: new Date().toISOString(),
        rejection_reason: null, // Clear any previous rejection reason
        completed_at: new Date().toISOString(), // Mark as completed
      })
      .eq("id", step_instance_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error approving step:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de l'approbation de l'étape" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stepInstance: updatedStep,
    });
  } catch (error) {
    console.error("Error in approve step endpoint:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
