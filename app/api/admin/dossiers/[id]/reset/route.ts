import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const ResetDossierSchema = z.object({
  reason: z.string().min(1, "La raison est obligatoire"),
});

/**
 * POST /api/admin/dossiers/[id]/reset
 * Complete reset of a dossier — like a brand new dossier.
 * Order of operations (FK constraints):
 * 1. Clear dossier.current_step_instance_id (FK → step_instances)
 * 2. Clear documents.current_version_id (circular FK → document_versions)
 * 3. Delete document_versions (FK → documents)
 * 4. Delete documents (FK → dossiers, step_instances)
 * 5. Delete step_instances (CASCADE → step_field_values, step_field_value_reviews, step_instance_reviews)
 * 6. Recreate step_instances from product_steps
 * 7. Update dossier: status=QUALIFICATION, current_step_instance_id, metadata
 * 8. Create DOSSIER_RESET event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdminAuth();
    const { id: dossierId } = await params;

    const body: unknown = await request.json();
    const validation = ResetDossierSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message },
        { status: 400 }
      );
    }
    const { reason } = validation.data;

    const supabase = createAdminClient();

    // Fetch dossier (need product_id and previous status)
    const { data: dossier, error: dossierFetchError } = await supabase
      .from("dossiers")
      .select("id, status, metadata, user_id, product_id")
      .eq("id", dossierId)
      .single();

    if (dossierFetchError || !dossier) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    // 1. Clear dossier.current_step_instance_id to allow step_instances deletion
    const { error: clearCurrentStepError } = await supabase
      .from("dossiers")
      .update({ current_step_instance_id: null })
      .eq("id", dossierId);

    if (clearCurrentStepError) {
      console.error("[reset] Error clearing current_step_instance_id:", clearCurrentStepError);
      return NextResponse.json(
        { error: "Erreur lors de la préparation du reset" },
        { status: 500 }
      );
    }

    // 2. Get all document IDs then clear current_version_id (circular FK)
    const { data: documents } = await supabase
      .from("documents")
      .select("id")
      .eq("dossier_id", dossierId);

    const documentIds = (documents ?? []).map((d) => d.id);

    if (documentIds.length > 0) {
      const { error: clearVersionError } = await supabase
        .from("documents")
        .update({ current_version_id: null })
        .in("id", documentIds);

      if (clearVersionError) {
        console.error("[reset] Error clearing current_version_id:", clearVersionError);
        return NextResponse.json(
          { error: "Erreur lors de la réinitialisation des documents" },
          { status: 500 }
        );
      }

      // 3. Delete document_versions
      const { error: deleteVersionsError } = await supabase
        .from("document_versions")
        .delete()
        .in("document_id", documentIds);

      if (deleteVersionsError) {
        console.error("[reset] Error deleting document_versions:", deleteVersionsError);
        return NextResponse.json(
          { error: "Erreur lors de la suppression des versions de documents" },
          { status: 500 }
        );
      }

      // 4. Delete documents
      const { error: deleteDocsError } = await supabase
        .from("documents")
        .delete()
        .in("id", documentIds);

      if (deleteDocsError) {
        console.error("[reset] Error deleting documents:", deleteDocsError);
        return NextResponse.json(
          { error: "Erreur lors de la suppression des documents" },
          { status: 500 }
        );
      }
    }

    // 5. Delete step_instances (CASCADE deletes step_field_values + reviews)
    const { error: deleteStepInstancesError } = await supabase
      .from("step_instances")
      .delete()
      .eq("dossier_id", dossierId);

    if (deleteStepInstancesError) {
      console.error("[reset] Error deleting step_instances:", deleteStepInstancesError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression des étapes" },
        { status: 500 }
      );
    }

    // 6. Recreate step_instances from product_steps
    const { data: productSteps, error: productStepsError } = await supabase
      .from("product_steps")
      .select("step_id, position")
      .eq("product_id", dossier.product_id)
      .order("position", { ascending: true });

    if (productStepsError) {
      console.error("[reset] Error fetching product_steps:", productStepsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des étapes du produit" },
        { status: 500 }
      );
    }

    let newFirstStepInstanceId: string | null = null;

    if (productSteps && productSteps.length > 0) {
      const startedAt = new Date().toISOString();
      const stepInstancesData = productSteps.map((ps, index) => ({
        dossier_id: dossierId,
        step_id: ps.step_id,
        started_at: index === 0 ? startedAt : null,
      }));

      const { data: createdInstances, error: createInstancesError } = await supabase
        .from("step_instances")
        .insert(stepInstancesData)
        .select("id, started_at");

      if (createInstancesError || !createdInstances) {
        console.error("[reset] Error recreating step_instances:", createInstancesError);
        return NextResponse.json(
          { error: "Erreur lors de la recréation des étapes" },
          { status: 500 }
        );
      }

      const firstInstance =
        createdInstances.find((si) => si.started_at !== null) ??
        createdInstances[0];

      newFirstStepInstanceId = firstInstance?.id ?? null;
    }

    // 7. Update dossier
    const updatedMetadata = {
      ...(dossier.metadata ?? {}),
      reset_at: new Date().toISOString(),
      reset_reason: reason,
      reset_by: adminUser.id,
      previous_status: dossier.status,
    };

    const { error: dossierUpdateError } = await supabase
      .from("dossiers")
      .update({
        status: "QUALIFICATION",
        current_step_instance_id: newFirstStepInstanceId,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dossierId);

    if (dossierUpdateError) {
      console.error("[reset] Error updating dossier:", dossierUpdateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du dossier" },
        { status: 500 }
      );
    }

    // 8. Create DOSSIER_RESET event
    const { error: eventError } = await supabase.from("events").insert({
      entity_type: "dossier",
      entity_id: dossierId,
      event_type: "DOSSIER_RESET",
      actor_type: "ADMIN",
      actor_id: adminUser.id,
      payload: {
        dossier_id: dossierId,
        reset_reason: reason,
        reset_by: adminUser.id,
        previous_status: dossier.status,
        documents_deleted: documentIds.length,
        step_instances_recreated: productSteps?.length ?? 0,
      },
    });

    if (eventError) {
      console.error("[reset] Error creating event:", eventError);
      // Non-blocking: event logging failure shouldn't fail the reset
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/dossiers/[id]/reset]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
