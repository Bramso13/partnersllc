import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/dossiers/[id]/delivery-history
 * Fetch all admin-delivered documents for a dossier (both step-related and manual)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId } = await params;
    const supabase = createAdminClient();

    // Fetch all documents uploaded by agents for this dossier
    // This includes both step-related (step_instance_id set) and manual (step_instance_id NULL)
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select(
        `
        id,
        document_type_id,
        step_instance_id,
        created_at,
        current_version:document_versions!fk_current_version (
          id,
          file_name,
          file_size_bytes,
          uploaded_at,
          uploaded_by_id
        ),
        document_type:document_types (
          label
        ),
        step_instance:step_instances (
          id,
          step:steps (
            label
          )
        )
      `
      )
      .eq("dossier_id", dossierId)
      .eq("status", "DELIVERED")
      .order("created_at", { ascending: false });

    if (documentsError) {
      console.error("Error fetching delivery history:", documentsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération de l'historique" },
        { status: 500 }
      );
    }

    console.log("documents", documents);

    // Get all unique agent IDs from document versions
    const agentIds = new Set<string>();
    (documents || []).forEach((doc) => {
      const currentVersion = Array.isArray(doc.current_version)
        ? doc.current_version[0]
        : doc.current_version;
      if (currentVersion?.uploaded_by_id) {
        agentIds.add(currentVersion.uploaded_by_id);
      }
    });

    // Fetch agent information
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, name, email")
      .in("id", Array.from(agentIds));

    if (agentsError) {
      console.error("Error fetching agents:", agentsError);
    }

    // Create a map of agent IDs to agent info
    const agentMap = new Map((agents || []).map((agent) => [agent.id, agent]));

    // Filter to only include documents uploaded by agents
    // and enrich with agent information
    const adminDeliveredDocuments = (documents || [])
      .map((doc) => {
        const currentVersion = Array.isArray(doc.current_version)
          ? doc.current_version[0]
          : doc.current_version;
        return { ...doc, current_version: currentVersion };
      })
      .filter((doc) => {
        // Check if document version was uploaded by an agent
        // We need to check the uploaded_by_type from document_versions
        return doc.current_version?.uploaded_by_id;
      })
      .map((doc) => {
        const agentId = doc.current_version?.uploaded_by_id;
        const agent = agentId ? agentMap.get(agentId) : null;

        // Normalize step_instance
        const stepInstance = Array.isArray(doc.step_instance)
          ? doc.step_instance[0]
          : doc.step_instance;

        // Normalize step within step_instance
        const step = stepInstance
          ? Array.isArray(stepInstance.step)
            ? stepInstance.step[0]
            : stepInstance.step
          : null;

        return {
          id: doc.id,
          document_type_id: doc.document_type_id,
          step_instance_id: doc.step_instance_id,
          created_at: doc.created_at,
          current_version: doc.current_version,
          document_type: Array.isArray(doc.document_type)
            ? doc.document_type[0]
            : doc.document_type,
          step_instance: stepInstance
            ? {
                id: stepInstance.id,
                step: step,
              }
            : null,
          agent: agent || null,
        };
      });

    return NextResponse.json({
      documents: adminDeliveredDocuments,
    });
  } catch (error) {
    console.error(
      "Error in GET /api/admin/dossiers/[id]/delivery-history:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
