import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminAuth } from "@/lib/auth";
import { z } from "zod";

// =========================================================
// VALIDATION SCHEMAS
// =========================================================

const AssignmentTypeSchema = z.enum(["VERIFICATEUR", "CREATEUR"]);

const PutAssignmentSchema = z.object({
  assignmentType: AssignmentTypeSchema,
  agentId: z.string().uuid().nullable(),
});

// =========================================================
// GET - Fetch current dossier agent assignments
// =========================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication
    await requireAdminAuth();

    // 2. Await and validate dossier ID
    const { id } = await params;
    const dossierId = z.string().uuid().parse(id);

    // 3. Fetch assignments (agents only; no profiles join — agents table has name)
    const supabase = createAdminClient();
    const { data: assignments, error } = await supabase
      .from("dossier_agent_assignments")
      .select(
        `
        id,
        assignment_type,
        created_at,
        agent:agents (
          id,
          email,
          name
        )
      `
      )
      .eq("dossier_id", dossierId);

    if (error) {
      console.error("[GET /api/admin/dossiers/[id]/dossier-agent-assignments]", error);
      return NextResponse.json(
        { error: "Failed to fetch dossier agent assignments" },
        { status: 500 }
      );
    }

    // 4. Transform to expected format
    const result = {
      verificateur: null as { id: string; full_name: string; email: string } | null,
      createur: null as { id: string; full_name: string; email: string } | null,
    };

    assignments?.forEach((assignment: { assignment_type: string; agent: { id: string; email: string; name?: string } | { id: string; email: string; name?: string }[] }) => {
      const agent = Array.isArray(assignment.agent)
        ? assignment.agent[0]
        : assignment.agent;

      if (!agent) return;

      const agentData = {
        id: agent.id,
        full_name: agent.name || agent.email || "Inconnu",
        email: agent.email,
      };

      if (assignment.assignment_type === "VERIFICATEUR") {
        result.verificateur = agentData;
      } else if (assignment.assignment_type === "CREATEUR") {
        result.createur = agentData;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid dossier ID", details: error.errors },
        { status: 400 }
      );
    }

    console.error(
      "[GET /api/admin/dossiers/[id]/dossier-agent-assignments] Unexpected error:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =========================================================
// PUT - Assign or unassign agent to dossier by type
// =========================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication
    const profile = await requireAdminAuth();

    // 2. Await and validate dossier ID
    const { id } = await params;
    const dossierId = z.string().uuid().parse(id);

    // 3. Parse and validate body
    const body: unknown = await request.json();
    const { assignmentType, agentId } = PutAssignmentSchema.parse(body);

    const supabase = createAdminClient();

    // 4. Verify dossier exists
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("id")
      .eq("id", dossierId)
      .single();

    if (dossierError || !dossier) {
      return NextResponse.json(
        { error: "Dossier not found" },
        { status: 404 }
      );
    }

    // 5. If agentId is null, remove assignment
    if (agentId === null) {
      const { error: deleteError } = await supabase
        .from("dossier_agent_assignments")
        .delete()
        .eq("dossier_id", dossierId)
        .eq("assignment_type", assignmentType);

      if (deleteError) {
        console.error("[PUT /api/admin/dossiers/[id]/dossier-agent-assignments] Delete error:", deleteError);
        return NextResponse.json(
          { error: "Failed to remove assignment" },
          { status: 500 }
        );
      }

      // Log event
      await supabase.from("events").insert({
        dossier_id: dossierId,
        event_type: "DOSSIER_AGENT_UNASSIGNED",
        event_data: {
          assignment_type: assignmentType,
          admin_id: profile.id,
          admin_name: profile.full_name,
        },
      });

      return NextResponse.json({
        message: "Assignment removed successfully",
        assignment_type: assignmentType,
      });
    }

    // 6. Verify agent exists and has correct type
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, agent_type, active")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // 7. Verify agent type matches assignment type
    if (agent.agent_type !== assignmentType) {
      return NextResponse.json(
        {
          error: "Agent type mismatch",
          details: `Agent has type ${agent.agent_type} but assignment type is ${assignmentType}`,
        },
        { status: 400 }
      );
    }

    // 8. Verify agent is active
    if (!agent.active) {
      return NextResponse.json(
        { error: "Cannot assign inactive agent" },
        { status: 400 }
      );
    }

    // 9. Upsert assignment (insert or update if exists)
    const { data: existingAssignment } = await supabase
      .from("dossier_agent_assignments")
      .select("id, agent_id")
      .eq("dossier_id", dossierId)
      .eq("assignment_type", assignmentType)
      .maybeSingle();

    const oldAgentId = existingAssignment?.agent_id || null;

    const { error: upsertError } = await supabase
      .from("dossier_agent_assignments")
      .upsert(
        {
          dossier_id: dossierId,
          agent_id: agentId,
          assignment_type: assignmentType,
        },
        {
          onConflict: "dossier_id,assignment_type",
        }
      );

    if (upsertError) {
      console.error("[PUT /api/admin/dossiers/[id]/dossier-agent-assignments] Upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to assign agent" },
        { status: 500 }
      );
    }

    // 10. Log event
    await supabase.from("events").insert({
      dossier_id: dossierId,
      event_type: existingAssignment ? "DOSSIER_AGENT_REASSIGNED" : "DOSSIER_AGENT_ASSIGNED",
      event_data: {
        assignment_type: assignmentType,
        old_agent_id: oldAgentId,
        new_agent_id: agentId,
        admin_id: profile.id,
        admin_name: profile.full_name,
      },
    });

    return NextResponse.json({
      message: existingAssignment ? "Agent reassigned successfully" : "Agent assigned successfully",
      assignment: {
        dossier_id: dossierId,
        agent_id: agentId,
        assignment_type: assignmentType,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error(
      "[PUT /api/admin/dossiers/[id]/dossier-agent-assignments] Unexpected error:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
