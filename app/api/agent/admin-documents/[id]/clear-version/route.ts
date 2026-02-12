import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth, getAgentId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * PATCH /api/agent/admin-documents/[documentId]/clear-version
 * Met current_version_id à null pour le document (suppression logique).
 * L'agent doit être le créateur assigné à la step.
 * Les lignes document_versions ne sont pas supprimées (audit conservé).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agentProfile = await requireAgentAuth();
    const { id: documentId } = await params;
    const supabase = createAdminClient();

    const agentId = await getAgentId(agentProfile.email);
    if (!agentId) {
      return NextResponse.json(
        { error: "Agent non trouvé" },
        { status: 403 }
      );
    }

    const { data: document, error: docError } = await supabase
      .from("documents")
      .select(
        `
        id,
        dossier_id,
        step_instance_id,
        step_instance:step_instances!documents_step_instance_id_fkey(
          id,
          assigned_to,
          step:steps(step_type)
        )
      `
      )
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    if (!document.step_instance_id) {
      return NextResponse.json(
        { error: "Ce document n'est pas un document admin" },
        { status: 400 }
      );
    }

    type StepInstanceRow = {
      assigned_to: string | null;
      step?: { step_type: string } | { step_type: string }[];
    };
    const raw = document.step_instance as StepInstanceRow | StepInstanceRow[] | null;
    const stepInstance = Array.isArray(raw) ? raw[0] ?? null : raw;

    if (!stepInstance || stepInstance.assigned_to !== agentId) {
      return NextResponse.json(
        { error: "Non autorisé à supprimer ce document" },
        { status: 403 }
      );
    }

    const step = Array.isArray(stepInstance.step) ? stepInstance.step[0] : stepInstance.step;
    if (step?.step_type !== "ADMIN") {
      return NextResponse.json(
        { error: "Étape non admin" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({ current_version_id: null })
      .eq("id", documentId);

    if (updateError) {
      console.error("Clear version error:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression de la version courante" },
        { status: 500 }
      );
    }

    await supabase.from("events").insert({
      entity_type: "document",
      entity_id: documentId,
      event_type: "DOCUMENT_VERSION_CLEARED",
      actor_type: "AGENT",
      actor_id: agentId,
      payload: {
        dossier_id: document.dossier_id,
        step_instance_id: document.step_instance_id,
        agent_name: agentProfile.full_name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin document clear-version error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
