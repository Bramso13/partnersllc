import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor_name: string;
  details: string;
  type: "status_change" | "note" | "assignment" | "event" | "review";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAdminAuth();
    const { id: dossierId } = await params;

    const supabase = await createClient();
    const auditEntries: AuditEntry[] = [];

    // 1. Fetch status changes from dossier_status_history
    const { data: statusChanges } = await supabase
      .from("dossier_status_history")
      .select(
        `
        id,
        old_status,
        new_status,
        changed_by_id,
        changed_by_type,
        reason,
        created_at,
        agents:changed_by_id (name)
      `
      )
      .eq("dossier_id", dossierId)
      .eq("changed_by_type", "AGENT");

    (statusChanges || []).forEach((change: any) => {
      auditEntries.push({
        id: `status-${change.id}`,
        timestamp: change.created_at,
        action: `Changement de statut`,
        actor_name: change.agents?.name || "Agent inconnu",
        details: `${change.old_status} → ${change.new_status}${change.reason ? ` (${change.reason})` : ""}`,
        type: "status_change",
      });
    });

    // 2. Fetch internal notes
    const { data: notes } = await supabase
      .from("dossier_notes")
      .select(
        `
        id,
        note_text,
        created_at,
        agents:agent_id (name)
      `
      )
      .eq("dossier_id", dossierId);

    (notes || []).forEach((note: any) => {
      auditEntries.push({
        id: `note-${note.id}`,
        timestamp: note.created_at,
        action: "Note interne ajoutée",
        actor_name: note.agents?.name || "Agent inconnu",
        details: note.note_text,
        type: "note",
      });
    });

    // 3. Fetch agent events (manual completions, assignments, etc.)
    const { data: events } = await supabase
      .from("events")
      .select("*")
      .eq("entity_type", "dossier")
      .eq("entity_id", dossierId)
      .eq("actor_type", "AGENT");

    // Fetch agent names for events
    const agentIds = [...new Set((events || []).map((e: any) => e.actor_id).filter(Boolean))];
    const { data: agents } = await supabase
      .from("agents")
      .select("id, name")
      .in("id", agentIds);

    const agentMap = new Map((agents || []).map((a: any) => [a.id, a.name]));

    (events || []).forEach((event: any) => {
      const agentName = agentMap.get(event.actor_id) || "Agent inconnu";

      // Handle different event types
      if (event.event_type === "STEP_COMPLETED" && event.payload?.manual) {
        auditEntries.push({
          id: `event-${event.id}`,
          timestamp: event.created_at,
          action: "Étape complétée manuellement",
          actor_name: agentName,
          details: event.payload?.note || "Complétion manuelle par l'agent",
          type: "event",
        });
      } else if (
        event.payload?.action === "assignment_changed" &&
        event.payload?.old_agent_id !== event.payload?.new_agent_id
      ) {
        auditEntries.push({
          id: `event-${event.id}`,
          timestamp: event.created_at,
          action: "Assignation changée",
          actor_name: agentName,
          details: `Nouvel agent assigné`,
          type: "assignment",
        });
      }
    });

    // 4. Fetch document reviews by agents
    const { data: documents } = await supabase
      .from("documents")
      .select("id")
      .eq("dossier_id", dossierId);

    if (documents && documents.length > 0) {
      const documentIds = documents.map((d) => d.id);

      const { data: versions } = await supabase
        .from("document_versions")
        .select("id, document_id")
        .in("document_id", documentIds);

      if (versions && versions.length > 0) {
        const versionIds = versions.map((v) => v.id);

        const { data: reviews } = await supabase
          .from("document_reviews")
          .select(
            `
            id,
            status,
            reason,
            reviewed_at,
            agents:reviewed_by_id (name)
          `
          )
          .in("document_version_id", versionIds);

        (reviews || []).forEach((review: any) => {
          auditEntries.push({
            id: `review-${review.id}`,
            timestamp: review.reviewed_at,
            action: `Document ${review.status === "APPROVED" ? "approuvé" : "rejeté"}`,
            actor_name: review.agents?.name || "Agent inconnu",
            details: review.reason || "",
            type: "review",
          });
        });
      }
    }

    // Sort all entries by timestamp (newest first)
    auditEntries.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(auditEntries);
  } catch (error) {
    console.error("Error in GET audit-trail:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
