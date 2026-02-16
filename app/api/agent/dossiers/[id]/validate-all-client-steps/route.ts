import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getAgentId } from "@/lib/auth";
import { agentCanActAsVerificateurOnDossier } from "@/lib/agent/roles";

/**
 * POST /api/agent/dossiers/[id]/validate-all-client-steps
 * Valider en une fois toutes les step_instances CLIENT du dossier assignées à l'agent :
 * - Approuver tous les documents en PENDING (document_reviews APPROVED)
 * - Marquer chaque step comme complétée si les conditions sont remplies (option override)
 * Story 8.5
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAgentAuth();
    const agentId = await getAgentId(user.email);
    if (!agentId) {
      return NextResponse.json({ error: "Agent non trouvé" }, { status: 403 });
    }

    const { id: dossierId } = await params;

    const canVerify = await agentCanActAsVerificateurOnDossier(
      agentId,
      dossierId
    );
    if (!canVerify) {
      return NextResponse.json(
        { error: "Vous n'avez pas le rôle vérificateur sur ce dossier" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const completeDespiteMissing = !!body.completeDespiteMissing;

    const supabase = createAdminClient();

    // Step instances CLIENT du dossier, assignées à cet agent, non complétées
    const { data: stepInstances, error: stepsError } = await supabase
      .from("step_instances")
      .select(
        `
        id,
        step_id,
        completed_at,
        step:steps(id, step_type, label, code)
      `
      )
      .eq("dossier_id", dossierId)

      .is("completed_at", null);

    console.log("stepInstances from validate-all-client-steps", stepInstances);

    if (stepsError) {
      console.error("[validate-all-client-steps] stepsError", stepsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des étapes" },
        { status: 500 }
      );
    }

    const clientSteps = (stepInstances || []).filter((si: any) => {
      const step = Array.isArray(si.step) ? si.step[0] : si.step;
      return step?.step_type === "CLIENT";
    });

    console.log("clientSteps", clientSteps);

    if (clientSteps.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucune étape client à valider",
        completed_count: 0,
      });
    }

    const now = new Date().toISOString();
    let completedCount = 0;
    const errors: string[] = [];

    for (const stepInstance of clientSteps) {
      const step = Array.isArray(stepInstance.step)
        ? stepInstance.step[0]
        : stepInstance.step;

      // 1. Documents requis pour cette step
      const { data: stepDocTypes } = await supabase
        .from("step_document_types")
        .select("document_type_id")
        .eq("step_id", stepInstance.step_id);

      const docTypeIds = (stepDocTypes || []).map(
        (r: any) => r.document_type_id
      );

      // 2. Documents existants pour cette step_instance
      const { data: documents } = await supabase
        .from("documents")
        .select("id, status, current_version_id")
        .eq("dossier_id", dossierId)
        .eq("step_instance_id", stepInstance.id)
        .in("document_type_id", docTypeIds);

      // 3. Approuver tous les documents PENDING
      for (const doc of documents || []) {
        if (doc.status !== "PENDING" || !doc.current_version_id) continue;
        const { error: reviewErr } = await supabase
          .from("document_reviews")
          .insert({
            document_version_id: doc.current_version_id,
            reviewer_id: agentId,
            status: "APPROVED",
            reason: null,
          });
        if (reviewErr) {
          errors.push(`Document ${doc.id}: ${reviewErr.message}`);
          continue;
        }
        await supabase
          .from("documents")
          .update({ status: "APPROVED" })
          .eq("id", doc.id);
      }

      // 4. Vérifier si on peut compléter (tous approuvés ou override)
      const { data: docsAfter } = await supabase
        .from("documents")
        .select("id, status")
        .eq("dossier_id", dossierId)
        .eq("step_instance_id", stepInstance.id)
        .in("document_type_id", docTypeIds);

      const allApproved = (docsAfter || []).every(
        (d: any) => d.status === "APPROVED"
      );
      const canComplete = allApproved || completeDespiteMissing;

      if (!canComplete) {
        errors.push(
          `Étape ${(step as { label?: string } | null)?.label ?? stepInstance.id}: documents non tous approuvés (utilisez completeDespiteMissing pour forcer)`
        );
        continue;
      }

      // 5. Marquer la step comme complétée
      const { error: updateErr } = await supabase
        .from("step_instances")
        .update({
          completed_at: now,
          validation_status: "APPROVED",
          validated_by: agentId,
          validated_at: now,
        })
        .eq("id", stepInstance.id);

      if (updateErr) {
        errors.push(`Étape ${stepInstance.id}: ${updateErr.message}`);
        continue;
      }

      completedCount += 1;

      // 6. Event STEP_COMPLETED
      await supabase.from("events").insert({
        entity_type: "step_instance",
        entity_id: stepInstance.id,
        event_type: "STEP_COMPLETED",
        actor_type: "AGENT",
        actor_id: agentId,
        payload: {
          manual: !!completeDespiteMissing,
          agent_type: "VERIFICATEUR",
          agent_name: user.full_name || user.email,
          step_code: step?.code,
          step_label: step?.label,
          dossier_id: dossierId,
        },
      });
    }

    return NextResponse.json({
      success: errors.length === 0,
      message:
        completedCount === clientSteps.length
          ? `${completedCount} étape(s) client(s) validée(s)`
          : `${completedCount}/${clientSteps.length} étape(s) validée(s)`,
      completed_count: completedCount,
      total: clientSteps.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[validate-all-client-steps]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
