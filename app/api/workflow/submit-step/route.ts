import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { dossier_id, step_id, field_values } = body;

    if (!dossier_id || !step_id || !field_values) {
      return NextResponse.json(
        { message: "dossier_id, step_id et field_values sont requis" },
        { status: 400 }
      );
    }

    // Verify dossier ownership
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("*")
      .eq("id", dossier_id)
      .eq("user_id", user.id)
      .single();

    if (dossierError || !dossier) {
      return NextResponse.json(
        { message: "Dossier introuvable" },
        { status: 404 }
      );
    }

    // Get or create step instance
    let stepInstanceId: string;

    // Check if step instance already exists
    const { data: existingInstance } = await supabase
      .from("step_instances")
      .select("id")
      .eq("dossier_id", dossier_id)
      .eq("step_id", step_id)
      .single();

    if (existingInstance) {
      stepInstanceId = existingInstance.id;
    } else {
      // Create new step instance
      const { data: newInstance, error: instanceError } = await supabase
        .from("step_instances")
        .insert({
          dossier_id: dossier_id,
          step_id: step_id,
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

    // Get step fields to map field_keys to step_field_ids
    const { data: stepFields, error: stepFieldsError } = await supabase
      .from("step_fields")
      .select("id, field_key")
      .eq("step_id", step_id);

    if (stepFieldsError) {
      throw new Error("Erreur lors de la récupération des champs");
    }

    const fieldKeyToIdMap = new Map(
      (stepFields || []).map((field) => [field.field_key, field.id])
    );

    // Save field values
    const fieldValueInserts = Object.entries(field_values)
      .map(([fieldKey, value]) => {
        const stepFieldId = fieldKeyToIdMap.get(fieldKey);
        if (!stepFieldId) {
          console.warn(`Field key ${fieldKey} not found in step fields`);
          return null;
        }

        let valueString: string | null = null;
        let valueJsonb: any = null;

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
          created_by_id: user.id,
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

    // Update step instance to SUBMITTED status and mark as completed
    // completed_at = when user finished the step
    // validation_status = admin approval status (SUBMITTED/APPROVED/REJECTED)
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    const { data: updatedInstance, error: instanceUpdateError } =
      await adminClient
        .from("step_instances")
        .update({
          validation_status: "SUBMITTED",
          completed_at: new Date().toISOString(), // Mark as completed when user submits
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

    console.log("[SUBMIT STEP] Step instance updated:", {
      stepInstanceId,
      validation_status: updatedInstance?.validation_status,
    });

    // Update dossier current_step_instance_id
    // Use admin client to bypass RLS
    const { error: dossierUpdateError } = await adminClient
      .from("dossiers")
      .update({
        current_step_instance_id: stepInstanceId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dossier_id);

    if (dossierUpdateError) {
      console.error(
        "[SUBMIT STEP] Error updating dossier:",
        dossierUpdateError
      );
      throw new Error("Erreur lors de la mise à jour du dossier");
    }

    // Vérifier si toutes les step instances de type CLIENT du dossier sont soumises
    const { data: clientStepInstances } = await adminClient
      .from("step_instances")
      .select("id, validation_status, step:steps(step_type)")
      .eq("dossier_id", dossier_id);

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
            dossier_id: dossier_id,
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

    return NextResponse.json(
      {
        message: "Étape soumise. En attente de validation par notre équipe.",
        step_instance_id: stepInstanceId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la soumission de l'étape",
      },
      { status: 500 }
    );
  }
}
