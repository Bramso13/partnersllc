import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

// Types for API response
interface StepInstanceWithDetails {
  id: string;
  dossier_id: string;
  step_id: string;
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  dossier: {
    id: string;
    dossier_number: string | null;
    client_name: string;
    product_name: string | null;
  };
  step: {
    id: string;
    label: string | null;
    step_type: "CLIENT" | "ADMIN";
    code: string;
  };
}

interface AgentDashboardResponse {
  currentSteps: StepInstanceWithDetails[];
  completedSteps: StepInstanceWithDetails[];
  assignableSteps: StepInstanceWithDetails[];
  agent: {
    id: string;
    name: string;
    agent_type: "VERIFICATEUR" | "CREATEUR";
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdminAuth();
  const { id: agentId } = await params;
  const supabase = createAdminClient();

  try {
    // Validate agent ID
    const validatedAgentId = z.string().uuid().parse(agentId);

    // Get agent info
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name, agent_type, active")
      .eq("id", validatedAgentId)
      .single();

    if (agentError || !agent) {
      console.error(
        "[GET /api/admin/agents/[id]/dashboard] agent not found",
        agentError
      );
      return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
    }

    if (!agent.active) {
      return NextResponse.json({ error: "Agent inactif" }, { status: 400 });
    }

    // Determine compatible step_type based on agent_type
    // VERIFICATEUR handles CLIENT steps, CREATEUR handles ADMIN steps
    const compatibleStepType =
      agent.agent_type === "VERIFICATEUR" ? "CLIENT" : "ADMIN";

    // 1. Get current steps (assigned to this agent, not completed)
    const { data: currentStepsRaw, error: currentError } = await supabase
      .from("step_instances")
      .select(
        `
        id,
        dossier_id,
        step_id,
        assigned_to,
        started_at,
        completed_at,
        created_at,
        dossiers:dossiers!step_instances_dossier_id_fkey!inner (
          id,
          user_id,
          product_id,
          metadata,
          status
        ),
        steps!inner (
          id,
          label,
          step_type,
          code
        )
      `
      )
      .eq("assigned_to", validatedAgentId)
      .is("completed_at", null)
      .order("created_at", { ascending: true });

    if (currentError) {
      console.error(
        "[GET /api/admin/agents/[id]/dashboard] current steps error",
        currentError
      );
      return NextResponse.json(
        { error: "Erreur lors du chargement des tâches en cours" },
        { status: 500 }
      );
    }

    // 2. Get completed steps (assigned to this agent, completed)
    const { data: completedStepsRaw, error: completedError } = await supabase
      .from("step_instances")
      .select(
        `
        id,
        dossier_id,
        step_id,
        assigned_to,
        started_at,
        completed_at,
        created_at,
        dossiers:dossiers!step_instances_dossier_id_fkey!inner (
          id,
          user_id,
          product_id,
          metadata,
          status
        ),
        steps!inner (
          id,
          label,
          step_type,
          code
        )
      `
      )
      .eq("assigned_to", validatedAgentId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(20);

    if (completedError) {
      console.error(
        "[GET /api/admin/agents/[id]/dashboard] completed steps error",
        completedError
      );
      return NextResponse.json(
        { error: "Erreur lors du chargement de l'historique" },
        { status: 500 }
      );
    }

    // 3. Get assignable steps (not completed, not assigned or assigned to another agent, compatible step_type)
    // Use OR to include: (assigned_to IS NULL) OR (assigned_to != agentId)
    const { data: assignableStepsRaw, error: assignableError } = await supabase
      .from("step_instances")
      .select(
        `
        id,
        dossier_id,
        step_id,
        assigned_to,
        started_at,
        completed_at,
        created_at,
        dossiers:dossiers!step_instances_dossier_id_fkey!inner (
          id,
          user_id,
          product_id,
          metadata,
          status
        ),
        steps!inner (
          id,
          label,
          step_type,
          code
        )
      `
      )
      .is("completed_at", null)
      .or(`assigned_to.is.null,assigned_to.neq.${validatedAgentId}`)
      .eq("steps.step_type", compatibleStepType)
      .not("dossiers.status", "in", '("COMPLETED","CLOSED","ERROR")')
      .order("created_at", { ascending: true })
      .limit(50);

    if (assignableError) {
      console.error(
        "[GET /api/admin/agents/[id]/dashboard] assignable steps error",
        assignableError
      );
      return NextResponse.json(
        { error: "Erreur lors du chargement des tâches assignables" },
        { status: 500 }
      );
    }

    // Collect user IDs and product IDs for enrichment
    const allSteps = [
      ...(currentStepsRaw || []),
      ...(completedStepsRaw || []),
      ...(assignableStepsRaw || []),
    ];
    const userIds = [
      ...new Set(allSteps.map((s: any) => s.dossiers?.user_id).filter(Boolean)),
    ];
    const productIds = [
      ...new Set(
        allSteps.map((s: any) => s.dossiers?.product_id).filter(Boolean)
      ),
    ];

    // Get user profiles
    let profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      profileMap = new Map(
        profiles?.map((p) => [p.id, p.full_name || "Client inconnu"]) || []
      );
    }

    // Get products
    let productMap = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      productMap = new Map(products?.map((p) => [p.id, p.name]) || []);
    }

    // Transform step instances to include enriched data
    const transformStepInstance = (stepRaw: any): StepInstanceWithDetails => {
      const dossier = stepRaw.dossiers;
      const step = stepRaw.steps;
      const metadata = dossier?.metadata as { dossier_number?: string } | null;

      return {
        id: stepRaw.id,
        dossier_id: stepRaw.dossier_id,
        step_id: stepRaw.step_id,
        assigned_to: stepRaw.assigned_to,
        started_at: stepRaw.started_at,
        completed_at: stepRaw.completed_at,
        created_at: stepRaw.created_at,
        dossier: {
          id: dossier?.id || stepRaw.dossier_id,
          dossier_number: metadata?.dossier_number || null,
          client_name: profileMap.get(dossier?.user_id) || "Client inconnu",
          product_name: productMap.get(dossier?.product_id) || null,
        },
        step: {
          id: step?.id || stepRaw.step_id,
          label: step?.label || null,
          step_type: step?.step_type || "CLIENT",
          code: step?.code || "",
        },
      };
    };

    const currentSteps = (currentStepsRaw || []).map(transformStepInstance);
    const completedSteps = (completedStepsRaw || []).map(transformStepInstance);
    const assignableSteps = (assignableStepsRaw || []).map(
      transformStepInstance
    );

    const response: AgentDashboardResponse = {
      currentSteps,
      completedSteps,
      assignableSteps,
      agent: {
        id: agent.id,
        name: agent.name,
        agent_type: agent.agent_type,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "ID d'agent invalide" },
        { status: 400 }
      );
    }

    console.error(
      "[GET /api/admin/agents/[id]/dashboard] unexpected error",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
