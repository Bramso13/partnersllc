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
  { params }: { params: Promise<{ id: string; document_id: string }> }
) {
  try {
    const profile = await requireAdminAuth();
    const { id: dossierId, document_id } = await params;
    const body = await req.json();

    const { rejection_reason } = body;

    // Validate rejection reason
    if (!rejection_reason || rejection_reason.trim().length < 10) {
      return NextResponse.json(
        { error: "La raison du rejet doit contenir au moins 10 caractères" },
        { status: 400 }
      );
    }

    // Get or create agent ID for this user
    const agentId = await getOrCreateAgent(
      profile.id, 
      profile.full_name ?? '', 
      profile.email ?? ''
    );

    const supabase = await createAdminClient();

    // Verify the document belongs to this dossier
    const { data: document, error: verifyError } = await supabase
      .from("documents")
      .select("id, dossier_id, status, current_version_id")
      .eq("id", document_id)
      .single();

    if (verifyError || !document) {
      console.error("[REJECT DOC] Document not found:", document_id, verifyError);
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    if (document.dossier_id !== dossierId) {
      console.error("[REJECT DOC] Document belongs to different dossier:", {
        document_id,
        expected_dossier: dossierId,
        actual_dossier: document.dossier_id,
      });
      return NextResponse.json(
        { error: "Document non autorisé pour ce dossier" },
        { status: 403 }
      );
    }

    if (!document.current_version_id) {
      console.error("[REJECT DOC] Document has no current_version_id:", document_id);
      return NextResponse.json(
        { error: "Le document n'a pas de version courante" },
        { status: 400 }
      );
    }

    console.log("[REJECT DOC] Rejecting document:", {
      document_id,
      current_version_id: document.current_version_id,
      agent_id: agentId,
      reason: rejection_reason,
    });

    // Update document status to REJECTED
    const { data: updatedDocument, error: updateError } = await supabase
      .from("documents")
      .update({
        status: "REJECTED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", document_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error rejecting document:", updateError);
      return NextResponse.json(
        { error: "Erreur lors du rejet du document" },
        { status: 500 }
      );
    }

    // Create document review record
    const { data: review, error: reviewError } = await supabase
      .from("document_reviews")
      .insert({
        document_version_id: updatedDocument.current_version_id,
        reviewer_id: agentId,
        status: "REJECTED",
        reason: rejection_reason.trim(),
        reviewed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reviewError) {
      console.error("[REJECT DOC] Error creating document review:", reviewError);
      // Don't fail the request if review creation fails
    } else {
      console.log("[REJECT DOC] Document review created:", review?.id);
    }

    console.log("[REJECT DOC] Document rejected successfully:", document_id);

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Error in reject document endpoint:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
