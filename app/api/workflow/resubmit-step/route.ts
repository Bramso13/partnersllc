import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { step_instance_id, corrected_fields } = body;

    if (!step_instance_id || !corrected_fields) {
      return NextResponse.json(
        { message: "step_instance_id et corrected_fields sont requis" },
        { status: 400 }
      );
    }

    // Verify user owns this step instance
    // Use explicit relationship name to avoid ambiguity
    const { data: stepInstance, error: stepInstanceError } = await supabase
      .from("step_instances")
      .select("*, dossiers!step_instances_dossier_id_fkey!inner(user_id)")
      .eq("id", step_instance_id)
      .single();

    if (stepInstanceError || !stepInstance) {
      console.error(
        "[RESUBMIT STEP] Step instance not found:",
        step_instance_id,
        stepInstanceError
      );
      return NextResponse.json(
        { message: "Instance d'étape introuvable" },
        { status: 404 }
      );
    }

    // Type assertion for dossier relation
    const dossier = (stepInstance as any).dossiers;
    if (dossier.user_id !== user.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 });
    }

    // Verify step is REJECTED
    if (stepInstance.validation_status !== "REJECTED") {
      return NextResponse.json(
        { message: "Cette étape n'a pas été rejetée" },
        { status: 400 }
      );
    }

    // Get step fields to map field_keys to step_field_ids
    const { data: stepFields, error: stepFieldsError } = await supabase
      .from("step_fields")
      .select("id, field_key")
      .eq("step_id", stepInstance.step_id);

    if (stepFieldsError) {
      throw new Error("Erreur lors de la récupération des champs");
    }

    const fieldKeyToIdMap = new Map(
      (stepFields || []).map((field) => [field.field_key, field.id])
    );

    // Update only rejected field values
    for (const [fieldKey, newValue] of Object.entries(corrected_fields)) {
      const stepFieldId = fieldKeyToIdMap.get(fieldKey);
      if (!stepFieldId) {
        console.warn(`Field key ${fieldKey} not found in step fields`);
        continue;
      }

      // Get current field value to ensure it's REJECTED
      const { data: currentFieldValue } = await supabase
        .from("step_field_values")
        .select("id, validation_status")
        .eq("step_instance_id", step_instance_id)
        .eq("step_field_id", stepFieldId)
        .single();

      if (
        !currentFieldValue ||
        currentFieldValue.validation_status !== "REJECTED"
      ) {
        console.warn(`Field ${fieldKey} is not rejected, skipping`);
        continue;
      }

      let valueString: string | null = null;
      let valueJsonb: any = null;

      if (Array.isArray(newValue)) {
        valueJsonb = newValue;
        valueString = JSON.stringify(newValue);
      } else if (typeof newValue === "boolean") {
        valueString = newValue ? "true" : "false";
      } else if (newValue !== null && newValue !== undefined) {
        valueString = String(newValue);
      }

      const { error: updateError } = await supabase
        .from("step_field_values")
        .update({
          value: valueString,
          value_jsonb: valueJsonb,
          validation_status: "PENDING",
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("step_instance_id", step_instance_id)
        .eq("step_field_id", stepFieldId)
        .eq("validation_status", "REJECTED");

      if (updateError) {
        console.error(`Error updating field ${fieldKey}:`, updateError);
        throw new Error(`Erreur lors de la mise à jour du champ ${fieldKey}`);
      }
    }

    // Re-submit step instance for admin review
    // Update completed_at to reflect when user finished the corrections
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    const { data: updatedInstance, error: instanceUpdateError } = await adminClient
      .from("step_instances")
      .update({
        validation_status: "SUBMITTED",
        completed_at: new Date().toISOString(), // Update completion time
        rejection_reason: null,
        validated_by: null,
        validated_at: null,
      })
      .eq("id", step_instance_id)
      .select("id, validation_status, completed_at")
      .single();

    if (instanceUpdateError) {
      console.error("[RESUBMIT STEP] Error updating step instance:", instanceUpdateError);
      throw new Error("Erreur lors de la mise à jour de l'instance");
    }

    console.log("[RESUBMIT STEP] Step instance updated:", {
      step_instance_id,
      validation_status: updatedInstance?.validation_status,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Corrections envoyées pour validation",
      },
      { status: 200 }
    );
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
