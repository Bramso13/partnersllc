import { createClient, createAdminClient } from "@/lib/supabase/server";

interface FieldValueInput {
  field_key: string;
  value: unknown;
}

export interface SubmitStepResult {
  success: boolean;
  step_instance_id: string;
  message?: string;
}

export async function submitStep(
  userId: string,
  dossierId: string,
  stepId: string,
  fieldValues: Record<string, unknown>
): Promise<SubmitStepResult> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", dossierId)
    .eq("user_id", userId)
    .single();

  if (dossierError || !dossier) {
    throw new Error("Dossier introuvable");
  }

  let stepInstanceId: string;

  const { data: existingInstance } = await supabase
    .from("step_instances")
    .select("id")
    .eq("dossier_id", dossierId)
    .eq("step_id", stepId)
    .single();

  if (existingInstance) {
    stepInstanceId = existingInstance.id;
  } else {
    const { data: newInstance, error: instanceError } = await supabase
      .from("step_instances")
      .insert({
        dossier_id: dossierId,
        step_id: stepId,
        started_at: new Date().toISOString(),
        validation_status: "SUBMITTED",
      })
      .select()
      .single();

    if (instanceError || !newInstance) {
      throw new Error("Erreur lors de la création de l'instance d'étape");
    }

    stepInstanceId = newInstance.id;
  }

  const { data: stepFields, error: stepFieldsError } = await supabase
    .from("step_fields")
    .select("id, field_key")
    .eq("step_id", stepId);

  if (stepFieldsError) {
    throw new Error("Erreur lors de la récupération des champs");
  }

  const fieldKeyToIdMap = new Map(
    (stepFields || []).map((field) => [field.field_key, field.id])
  );

  const fieldValueInserts = Object.entries(fieldValues)
    .map(([fieldKey, value]) => {
      const stepFieldId = fieldKeyToIdMap.get(fieldKey);
      if (!stepFieldId) {
        console.warn(`Field key ${fieldKey} not found in step fields`);
        return null;
      }

      let valueString: string | null = null;
      let valueJsonb: unknown = null;

      if (Array.isArray(value)) {
        valueJsonb = value;
        valueString = JSON.stringify(value);
      } else if (typeof value === "boolean") {
        valueString = value ? "true" : "false";
      } else if (value !== null && value !== undefined) {
        valueString = String(value);
      }

      return {
        step_instance_id: stepInstanceId,
        step_field_id: stepFieldId,
        value: valueString,
        value_jsonb: valueJsonb,
        created_by_type: "USER" as const,
        created_by_id: userId,
        validation_status: "PENDING",
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (fieldValueInserts.length > 0) {
    const { error: valuesError } = await supabase
      .from("step_field_values")
      .upsert(fieldValueInserts, {
        onConflict: "step_instance_id,step_field_id",
      });

    if (valuesError) {
      console.error("Error saving field values:", valuesError);
      throw new Error("Erreur lors de la sauvegarde des valeurs");
    }
  }

  const { data: updatedInstance, error: instanceUpdateError } =
    await adminClient
      .from("step_instances")
      .update({
        validation_status: "SUBMITTED",
        completed_at: new Date().toISOString(),
      })
      .eq("id", stepInstanceId)
      .select("id, validation_status, completed_at")
      .single();

  if (instanceUpdateError) {
    console.error(
      "[SUBMIT STEP] Error updating step instance:",
      instanceUpdateError
    );
    throw new Error("Erreur lors de la mise à jour de l'instance");
  }

  const { error: dossierUpdateError } = await adminClient
    .from("dossiers")
    .update({
      current_step_instance_id: stepInstanceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dossierId);

  if (dossierUpdateError) {
    console.error(
      "[SUBMIT STEP] Error updating dossier:",
      dossierUpdateError
    );
    throw new Error("Erreur lors de la mise à jour du dossier");
  }

  const { data: clientStepInstances } = await adminClient
    .from("step_instances")
    .select("id, validation_status, step:steps(step_type)")
    .eq("dossier_id", dossierId);

  const steps = (clientStepInstances || []) as Array<{
    id: string;
    validation_status: string;
    step: { step_type: string } | { step_type: string }[] | null;
  }>;
  const clientSteps = steps.filter((si) => {
    const step = Array.isArray(si.step) ? si.step[0] : si.step;
    return step?.step_type === "CLIENT";
  });
  const allClientStepsSubmitted =
    clientSteps.length > 0 &&
    clientSteps.every((si) => si.validation_status === "SUBMITTED");

  if (allClientStepsSubmitted) {
    const zapierWebhookUrl =
      process.env.ZAPIER_WEBHOOK_ALL_CLIENT_STEPS_SUBMITTED ||
      "https://hooks.zapier.com/hooks/catch/22567436/ueprhez/";
    try {
      const res = await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "all_client_steps_submitted",
          dossier_id: dossierId,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        console.warn(
          "[SUBMIT STEP] Zapier webhook failed:",
          res.status,
          await res.text()
        );
      }
    } catch (webhookErr) {
      console.warn("[SUBMIT STEP] Zapier webhook error:", webhookErr);
    }
  }

  return {
    success: true,
    step_instance_id: stepInstanceId,
    message: "Étape soumise. En attente de validation par notre équipe.",
  };
}
