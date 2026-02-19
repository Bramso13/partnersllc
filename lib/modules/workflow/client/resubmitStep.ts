import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface ResubmitStepResult {
  success: boolean;
  message: string;
}

export async function resubmitStep(
  userId: string,
  stepInstanceId: string,
  correctedFields: Record<string, unknown>
): Promise<ResubmitStepResult> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: stepInstance, error: stepInstanceError } = await supabase
    .from("step_instances")
    .select("*, dossiers!step_instances_dossier_id_fkey!inner(user_id)")
    .eq("id", stepInstanceId)
    .single();

  if (stepInstanceError || !stepInstance) {
    console.error(
      "[RESUBMIT STEP] Step instance not found:",
      stepInstanceId,
      stepInstanceError
    );
    throw new Error("Instance d'étape introuvable");
  }

  const dossier = (stepInstance as unknown as { dossiers: { user_id: string } }).dossiers;
  if (dossier.user_id !== userId) {
    throw new Error("Non autorisé");
  }

  if (stepInstance.validation_status !== "REJECTED") {
    throw new Error("Cette étape n'a pas été rejetée");
  }

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

  for (const [fieldKey, newValue] of Object.entries(correctedFields)) {
    const stepFieldId = fieldKeyToIdMap.get(fieldKey);
    if (!stepFieldId) {
      console.warn(`Field key ${fieldKey} not found in step fields`);
      continue;
    }

    const { data: currentFieldValue } = await supabase
      .from("step_field_values")
      .select("id, validation_status")
      .eq("step_instance_id", stepInstanceId)
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
    let valueJsonb: unknown = null;

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
      .eq("step_instance_id", stepInstanceId)
      .eq("step_field_id", stepFieldId)
      .eq("validation_status", "REJECTED");

    if (updateError) {
      console.error(`Error updating field ${fieldKey}:`, updateError);
      throw new Error(`Erreur lors de la mise à jour du champ ${fieldKey}`);
    }
  }

  const { data: updatedInstance, error: instanceUpdateError } = await adminClient
    .from("step_instances")
    .update({
      validation_status: "SUBMITTED",
      completed_at: new Date().toISOString(),
      rejection_reason: null,
      validated_by: null,
      validated_at: null,
    })
    .eq("id", stepInstanceId)
    .select("id, validation_status, completed_at")
    .single();

  if (instanceUpdateError) {
    console.error("[RESUBMIT STEP] Error updating step instance:", instanceUpdateError);
    throw new Error("Erreur lors de la mise à jour de l'instance");
  }

  return {
    success: true,
    message: "Corrections envoyées pour validation",
  };
}
