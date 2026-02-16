import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { agentCanActAsVerificateurOnDossier } from "@/lib/agent/roles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/agent/documents/[id]/review
 * Permet à un agent VERIFICATEUR de reviewer (approuver/rejeter) un document
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params;
    const user = await requireAgentAuth();
    const supabase = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { status, reason } = body as {
      status: "APPROVED" | "REJECTED";
      reason?: string;
    };

    // Validate status
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide. Doit être APPROVED ou REJECTED." },
        { status: 400 }
      );
    }

    // If rejected, reason is required (min 10 chars)
    if (status === "REJECTED") {
      if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
          { error: "Une raison de minimum 10 caractères est requise pour rejeter." },
          { status: 400 }
        );
      }
    }

    // Get agent from email
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, agent_type")
      .eq("email", user.email)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent non trouvé" },
        { status: 403 }
      );
    }

    // Get document with step_instance to get dossier_id and verify assignment
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select(
        `
        id,
        status,
        current_version_id,
        step_instance_id,
        dossier_id,
        step_instance:step_instances (
          id,
          assigned_to
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

    // Verify document belongs to step assigned to this agent (or admin)
    const stepInstance = Array.isArray(document.step_instance)
      ? document.step_instance[0]
      : document.step_instance;

    if (user.role !== "ADMIN" && stepInstance?.assigned_to !== agent.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à reviewer ce document" },
        { status: 403 }
      );
    }

    // Verify agent has VERIFICATEUR role on this dossier (or admin)
    if (user.role !== "ADMIN") {
      const canReview = await agentCanActAsVerificateurOnDossier(
        agent.id,
        document.dossier_id
      );
      if (!canReview) {
        return NextResponse.json(
          { error: "Vous n'avez pas le rôle vérificateur sur ce dossier" },
          { status: 403 }
        );
      }
    }

    // Document must have a current version
    if (!document.current_version_id) {
      return NextResponse.json(
        { error: "Ce document n'a pas de version uploadée" },
        { status: 400 }
      );
    }

    // Create review record
    const { data: review, error: reviewError } = await supabase
      .from("document_reviews")
      .insert({
        document_version_id: document.current_version_id,
        reviewer_id: agent.id,
        status,
        reason: status === "REJECTED" ? reason?.trim() : null,
      })
      .select()
      .single();

    if (reviewError) {
      console.error("[POST /api/agent/documents/review] Review error", reviewError);
      return NextResponse.json(
        { error: "Erreur lors de la création de la review" },
        { status: 500 }
      );
    }

    // Update document status
    const { error: updateError } = await supabase
      .from("documents")
      .update({ status })
      .eq("id", documentId);

    if (updateError) {
      console.error("[POST /api/agent/documents/review] Update error", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du statut" },
        { status: 500 }
      );
    }

    // Create event
    await supabase.from("events").insert({
      entity_type: "document",
      entity_id: documentId,
      event_type: "DOCUMENT_REVIEWED",
      actor_type: "AGENT",
      actor_id: agent.id,
      payload: {
        status,
        reason: status === "REJECTED" ? reason?.trim() : null,
        reviewer_name: user.full_name || user.email,
        agent_type: "VERIFICATEUR",
        dossier_id: document.dossier_id,
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        status: review.status,
      },
    });
  } catch (error) {
    console.error("[POST /api/agent/documents/review] Error", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
