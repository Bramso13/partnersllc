import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get or create agent for user
async function getOrCreateAgent(userId: string, userName: string, userEmail: string) {
  const supabase = await createAdminClient();
  
  // Try to find existing agent by user ID (if agents table has user_id column)
  // or by email
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
  { params }: { params: Promise<{ id: string; field_value_id: string }> }
) {
  try {
    const profile = await requireAdminAuth();
    const { id: dossierId, field_value_id } = await params;

    // Get or create agent ID for this user
    const agentId = await getOrCreateAgent(
      profile.id, 
      profile.full_name ?? '', 
      profile.email ?? ''
    );

    const supabase = await createAdminClient();

    interface StepInstanceRow {
      dossier_id: string;
    }

    // Verify the field value belongs to this dossier
    const { data: fieldValue, error: verifyError } = await supabase
      .from("step_field_values")
      .select(
        `
        id,
        step_instance_id,
        validation_status,
        step_instances!inner (
          dossier_id
        )
      `
      )
      .eq("id", field_value_id)
      .single();

    if (verifyError || !fieldValue) {
      return NextResponse.json(
        { error: "Champ non trouvé" },
        { status: 404 }
      );
    }

    if ((fieldValue.step_instances as unknown as StepInstanceRow).dossier_id !== dossierId) {
      return NextResponse.json(
        { error: "Champ non autorisé pour ce dossier" },
        { status: 403 }
      );
    }

    // Update field value to APPROVED
    const { data: updatedField, error: updateError } = await supabase
      .from("step_field_values")
      .update({
        validation_status: "APPROVED",
        reviewed_by: agentId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null, // Clear any previous rejection reason
      })
      .eq("id", field_value_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error approving field:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de l'approbation du champ" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fieldValue: updatedField,
    });
  } catch (error) {
    console.error("Error in approve field endpoint:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
