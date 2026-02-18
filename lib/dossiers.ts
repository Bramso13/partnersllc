import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export {
  type DossierStatus,
  DOSSIER_STATUS_LIST,
  DOSSIER_STATUS_OPTIONS,
  isValidDossierStatus,
} from "@/lib/dossier-status";

export type {
  DossierType,
  Dossier,
  Step,
  StepInstance,
  Product,
  DocumentType,
  TimelineEvent,
  DossierWithDetails,
  DossierWithDetailsAndClient,
} from "@/types/dossiers";

import type {
  Dossier,
  DossierWithDetails,
  DossierWithDetailsAndClient,
  DocumentType,
  Product,
  Step,
  StepInstance,
  TimelineEvent,
} from "@/types/dossiers";

/**
 * Get all dossiers for the current authenticated user
 * RLS is enforced by Supabase
 */
export async function getUserDossiers(): Promise<DossierWithDetails[]> {
  const supabase = await createClient();

  // First, fetch dossiers
  const { data: dossiers, error: dossiersError } = await supabase
    .from("dossiers")
    .select("*")
    .order("created_at", { ascending: false });

  if (dossiersError) {
    console.error("Error fetching dossiers:", dossiersError);
    throw dossiersError;
  }

  if (!dossiers || dossiers.length === 0) {
    return [];
  }

  // Fetch related data for each dossier
  const dossiersWithDetails = await Promise.all(
    dossiers.map(async (dossier) => {
      // Fetch product
      let product: Product | null = null;
      if (dossier.product_id) {
        const { data: productData } = await supabase
          .from("products")
          .select("*")
          .eq("id", dossier.product_id)
          .single();
        product = productData as Product | null;
      }

      // Fetch step instances
      const { data: stepInstances } = await supabase
        .from("step_instances")
        .select("*")
        .eq("dossier_id", dossier.id);

      // Fetch steps for each step instance
      const stepInstancesWithSteps = await Promise.all(
        (stepInstances || []).map(async (si) => {
          const { data: step } = await supabase
            .from("steps")
            .select("*")
            .eq("id", si.step_id)
            .single();
          return {
            ...si,
            step: step as Step | null,
          };
        })
      );

      // Fetch current step instance if exists
      let currentStepInstance: (StepInstance & { step?: Step | null }) | null =
        null;
      if (dossier.current_step_instance_id) {
        const { data: currentSi } = await supabase
          .from("step_instances")
          .select("*")
          .eq("id", dossier.current_step_instance_id)
          .single();

        if (currentSi) {
          const { data: currentStep } = await supabase
            .from("steps")
            .select("*")
            .eq("id", currentSi.step_id)
            .single();

          currentStepInstance = {
            ...currentSi,
            step: currentStep as Step | null,
          };
        }
      }

      // Calculate progress
      const completedSteps = stepInstancesWithSteps.filter(
        (si) => si.completed_at !== null
      ).length;
      const totalSteps = stepInstancesWithSteps.length;
      const progressPercentage =
        totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      return {
        ...dossier,
        product,
        current_step_instance: currentStepInstance,
        step_instances: stepInstancesWithSteps,
        completed_steps_count: completedSteps,
        total_steps_count: totalSteps,
        progress_percentage: progressPercentage,
      } as DossierWithDetails;
    })
  );

  return dossiersWithDetails;
}

/** Payload pour créer un dossier en base */
export type CreateDossierInput = {
  user_id: string;
  product_id: string;
  type: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Assigne le premier agent CREATEUR (ou VERIFICATEUR_ET_CREATEUR) au dossier.
 * À appeler après chaque création de dossier pour l’auto-assignment.
 */
export async function assignFirstCreateurToDossier(
  supabase: SupabaseClient,
  dossierId: string
): Promise<void> {
  const { data: createurAgent } = await supabase
    .from("agents")
    .select("id, agent_type")
    .in("agent_type", ["CREATEUR", "VERIFICATEUR_ET_CREATEUR"])
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!createurAgent) return;

  if (createurAgent.agent_type === "CREATEUR") {
    await supabase.from("dossier_agent_assignments").insert({
      dossier_id: dossierId,
      agent_id: createurAgent.id,
      assignment_type: "CREATEUR",
    });
  } else if (createurAgent.agent_type === "VERIFICATEUR_ET_CREATEUR") {
    await supabase.from("dossier_agent_assignments").insert({
      dossier_id: dossierId,
      agent_id: createurAgent.id,
      assignment_type: "VERIFICATEUR",
    });
    await supabase.from("dossier_agent_assignments").insert({
      dossier_id: dossierId,
      agent_id: createurAgent.id,
      assignment_type: "CREATEUR",
    });
  }
}

/**
 * Crée un dossier en base et assigne automatiquement le premier agent CREATEUR.
 * À utiliser partout où un dossier est créé pour centraliser la logique.
 */
export async function createDossier(
  supabase: SupabaseClient,
  input: CreateDossierInput
): Promise<{ data: Dossier | null; error: Error | null }> {
  console.log("🔍 [createDossier] input:", input);
  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .insert({
      user_id: input.user_id,
      product_id: input.product_id,
      type: input.type,
      status: input.status ?? "QUALIFICATION",
      metadata: input.metadata ?? null,
    })
    .select()
    .single();

  console.log("🔍 [createDossier] dossier:", dossier);
  console.log("🔍 [createDossier] dossierError:", dossierError);
  if (dossierError || !dossier) {
    return {
      data: null,
      error: dossierError ?? new Error("Dossier creation failed"),
    };
  }
  console.log(
    "🔍 [createDossier] Creating admin step instances for dossier..."
  );
  await createAdminStepInstancesForDossier(dossier.id);
  console.log("🔍 [createDossier] Assigning first createur to dossier...");
  await assignFirstCreateurToDossier(supabase, dossier.id);
  return { data: dossier as Dossier, error: null };
}

/**
 * Get a single dossier by ID for agents (bypasses user RLS, requires agent auth)
 * Use this in admin/agent contexts where agents need to view any dossier
 */
export async function getAdminDossierById(
  dossierId: string
): Promise<DossierWithDetails | null> {
  const supabase = createAdminClient();

  // Query without user filtering (agents can see all dossiers)
  const { data: dossier, error } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", dossierId)
    .single();

  if (error) {
    console.error("Error fetching dossier:", error);
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  if (!dossier) {
    return null;
  }

  // Fetch related data (same as getDossierById)
  let product: Product | null = null;
  if (dossier.product_id) {
    const { data: productData } = await supabase
      .from("products")
      .select("*")
      .eq("id", dossier.product_id)
      .single();
    product = productData as Product | null;
  }

  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("*")
    .eq("dossier_id", dossier.id);

  const stepInstancesWithSteps = await Promise.all(
    (stepInstances || []).map(async (si) => {
      const { data: step } = await supabase
        .from("steps")
        .select("*")
        .eq("id", si.step_id)
        .single();
      return {
        ...si,
        step: step as Step | null,
      };
    })
  );

  let currentStepInstance: (StepInstance & { step?: Step | null }) | null =
    null;
  if (dossier.current_step_instance_id) {
    const { data: currentSi } = await supabase
      .from("step_instances")
      .select("*")
      .eq("id", dossier.current_step_instance_id)
      .single();

    if (currentSi) {
      const { data: currentStep } = await supabase
        .from("steps")
        .select("*")
        .eq("id", currentSi.step_id)
        .single();

      currentStepInstance = {
        ...currentSi,
        step: currentStep as Step | null,
      };
    }
  }

  const completedSteps = stepInstancesWithSteps.filter(
    (si) => si.completed_at !== null
  ).length;
  const totalSteps = stepInstancesWithSteps.length;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  let requiredDocuments: DocumentType[] = [];
  if (currentStepInstance?.step?.id) {
    const { data: documentTypes } = await supabase
      .from("document_types")
      .select("*")
      .eq("required_step_id", currentStepInstance.step.id);

    requiredDocuments = (documentTypes || []) as DocumentType[];
  }

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("entity_type", "dossier")
    .eq("entity_id", dossier.id)
    .order("created_at", { ascending: true });

  return {
    ...dossier,
    product,
    current_step_instance: currentStepInstance,
    step_instances: stepInstancesWithSteps,
    completed_steps_count: completedSteps,
    total_steps_count: totalSteps,
    progress_percentage: progressPercentage,
    required_documents: requiredDocuments,
    timeline_events: (events || []) as TimelineEvent[],
  } as DossierWithDetails;
}

/**
 * Get a single dossier by ID (with RLS enforcement)
 */
export async function getDossierById(
  dossierId: string
): Promise<DossierWithDetails | null> {
  const supabase = await createClient();

  const { data: dossier, error } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", dossierId)
    .single();

  if (error) {
    console.error("Error fetching dossier:", error);
    // If not found, return null instead of throwing
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  if (!dossier) {
    return null;
  }

  // Fetch related data
  let product: Product | null = null;
  if (dossier.product_id) {
    const { data: productData } = await supabase
      .from("products")
      .select("*")
      .eq("id", dossier.product_id)
      .single();
    product = productData as Product | null;
  }

  // Fetch step instances
  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("*")
    .eq("dossier_id", dossier.id);

  // Fetch steps for each step instance
  const stepInstancesWithSteps = await Promise.all(
    (stepInstances || []).map(async (si) => {
      const { data: step } = await supabase
        .from("steps")
        .select("*")
        .eq("id", si.step_id)
        .single();
      return {
        ...si,
        step: step as Step | null,
      };
    })
  );

  // Fetch current step instance if exists
  let currentStepInstance: (StepInstance & { step?: Step | null }) | null =
    null;
  if (dossier.current_step_instance_id) {
    const { data: currentSi } = await supabase
      .from("step_instances")
      .select("*")
      .eq("id", dossier.current_step_instance_id)
      .single();

    if (currentSi) {
      const { data: currentStep } = await supabase
        .from("steps")
        .select("*")
        .eq("id", currentSi.step_id)
        .single();

      currentStepInstance = {
        ...currentSi,
        step: currentStep as Step | null,
      };
    }
  }

  // Calculate progress
  const completedSteps = stepInstancesWithSteps.filter(
    (si) => si.completed_at !== null
  ).length;
  const totalSteps = stepInstancesWithSteps.length;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Fetch required documents for current step if exists
  let requiredDocuments: DocumentType[] = [];
  if (currentStepInstance?.step?.id) {
    const { data: documentTypes } = await supabase
      .from("document_types")
      .select("*")
      .eq("required_step_id", currentStepInstance.step.id);

    requiredDocuments = (documentTypes || []) as DocumentType[];
  }

  // Fetch timeline events for this dossier
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("entity_type", "dossier")
    .eq("entity_id", dossier.id)
    .order("created_at", { ascending: true });

  return {
    ...dossier,
    product,
    current_step_instance: currentStepInstance,
    step_instances: stepInstancesWithSteps,
    completed_steps_count: completedSteps,
    total_steps_count: totalSteps,
    progress_percentage: progressPercentage,
    required_documents: requiredDocuments,
    timeline_events: (events || []) as TimelineEvent[],
  } as DossierWithDetails;
}

/**
 * Get all dossiers for admin view (no user filtering)
 * Requires admin authentication to access
 */
export async function getAllAdminDossiers(): Promise<
  DossierWithDetailsAndClient[]
> {
  console.log("🔍 [getAllAdminDossiers] Starting...");
  const supabase = createAdminClient();

  // Fetch all dossiers
  console.log("🔍 [getAllAdminDossiers] Fetching dossiers...");
  const { data: dossiers, error: dossiersError } = await supabase
    .from("dossiers")
    .select("*")
    .order("created_at", { ascending: false });

  if (dossiersError) {
    console.error(
      "❌ [getAllAdminDossiers] Error fetching dossiers:",
      dossiersError
    );
    throw dossiersError;
  }

  console.log(
    "✅ [getAllAdminDossiers] Dossiers fetched:",
    dossiers?.length || 0
  );

  if (!dossiers || dossiers.length === 0) {
    console.log("⚠️ [getAllAdminDossiers] No dossiers found");
    return [];
  }

  // Get all user IDs and assigned agent IDs
  const userIds = [...new Set(dossiers.map((d) => d.user_id))];
  const agentIds = [
    ...new Set(dossiers.map((d) => d.assigned_agent_id).filter(Boolean)),
  ] as string[];

  console.log(
    "🔍 [getAllAdminDossiers] User IDs:",
    userIds.length,
    "Agent IDs:",
    agentIds.length
  );

  // Fetch all users (clients) info in one query
  console.log("🔍 [getAllAdminDossiers] Fetching profiles...");
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  console.log("✅ [getAllAdminDossiers] Profiles fetched:", users?.length || 0);

  // Get emails from auth.users
  console.log("🔍 [getAllAdminDossiers] Fetching auth users...");
  const { data: authUsers } = await supabase.auth.admin.listUsers();

  console.log(
    "✅ [getAllAdminDossiers] Auth users fetched:",
    authUsers?.users?.length || 0
  );

  const emailMap = new Map(
    authUsers?.users.map((u) => [u.id, u.email || ""]) || []
  );

  const usersMap = new Map(
    (users || []).map((u) => [
      u.id,
      { id: u.id, email: emailMap.get(u.id) || "", full_name: u.full_name },
    ])
  );

  console.log("🔍 [getAllAdminDossiers] Users map size:", usersMap.size);

  // Fetch agents info
  const agentsMap = new Map<
    string,
    { id: string; email: string; full_name: string | null }
  >();
  if (agentIds.length > 0) {
    console.log("🔍 [getAllAdminDossiers] Fetching agents...");
    const { data: agents } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", agentIds);

    console.log(
      "✅ [getAllAdminDossiers] Agents fetched:",
      agents?.length || 0
    );

    (agents || []).forEach((a) => {
      agentsMap.set(a.id, {
        id: a.id,
        email: emailMap.get(a.id) || "",
        full_name: a.full_name,
      });
    });
  }

  // Count pending documents for all dossiers in one query
  console.log("🔍 [getAllAdminDossiers] Fetching pending documents...");
  const { data: pendingDocs } = await supabase
    .from("documents")
    .select("dossier_id")
    .in("status", ["PENDING", "SUBMITTED"]);

  console.log(
    "✅ [getAllAdminDossiers] Pending docs fetched:",
    pendingDocs?.length || 0
  );

  const pendingDocsMap = (pendingDocs || []).reduce(
    (acc, doc) => {
      acc[doc.dossier_id] = (acc[doc.dossier_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log("🔍 [getAllAdminDossiers] Enriching dossiers with details...");

  // Enrich each dossier with details
  const dossiersWithDetails = await Promise.all(
    dossiers.map(async (dossier) => {
      // Fetch product
      let product: Product | null = null;
      if (dossier.product_id) {
        const { data: productData } = await supabase
          .from("products")
          .select("id, name, description")
          .eq("id", dossier.product_id)
          .single();
        product = productData as Product | null;
      }

      // Fetch step instances
      const { data: stepInstances } = await supabase
        .from("step_instances")
        .select("*")
        .eq("dossier_id", dossier.id)
        .order("started_at", { ascending: true });

      // Fetch steps for each step instance
      const stepInstancesWithSteps = await Promise.all(
        (stepInstances || []).map(async (si) => {
          const { data: step } = await supabase
            .from("steps")
            .select("*")
            .eq("id", si.step_id)
            .single();
          return {
            ...si,
            step: step as Step | null,
          };
        })
      );

      // Get current step instance if exists
      let currentStepInstance: (StepInstance & { step?: Step | null }) | null =
        null;
      if (dossier.current_step_instance_id) {
        const currentSi = stepInstancesWithSteps.find(
          (si) => si.id === dossier.current_step_instance_id
        );
        if (currentSi) {
          currentStepInstance = currentSi;
        }
      }

      // Calculate progress
      const completedSteps = stepInstancesWithSteps.filter(
        (si) => si.completed_at !== null
      ).length;
      const totalSteps = stepInstancesWithSteps.length;
      const progressPercentage =
        totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      return {
        ...dossier,
        product,
        current_step_instance: currentStepInstance,
        step_instances: stepInstancesWithSteps,
        completed_steps_count: completedSteps,
        total_steps_count: totalSteps,
        progress_percentage: progressPercentage,
        user: usersMap.get(dossier.user_id) || null,
        assigned_agent: dossier.assigned_agent_id
          ? agentsMap.get(dossier.assigned_agent_id) || null
          : null,
        pending_documents_count: pendingDocsMap[dossier.id] || 0,
      } as DossierWithDetailsAndClient;
    })
  );

  console.log(
    "✅ [getAllAdminDossiers] Final dossiers with details:",
    dossiersWithDetails.length
  );
  console.log(
    "🔍 [getAllAdminDossiers] Sample enriched dossier:",
    dossiersWithDetails[0]
  );

  return dossiersWithDetails;
}

export interface AdvisorInfo {
  id: string | null;
  name: string;
  email: string;
  role: string;
}

/**
 * Get advisor information for a dossier:
 * - First validated_by from step_instances
 * - Otherwise, first ADMIN from profiles
 * - Otherwise, first active agent from agents table
 */
export async function getDossierAdvisor(
  dossierId: string
): Promise<AdvisorInfo> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Try to get first validated_by from step_instances
  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("validated_by")
    .eq("dossier_id", dossierId)
    .not("validated_by", "is", null)
    .limit(1)
    .single();

  if (stepInstances?.validated_by) {
    // Get agent info
    const { data: agent } = await supabase
      .from("agents")
      .select("id, name, email")
      .eq("id", stepInstances.validated_by)
      .eq("active", true)
      .single();

    if (agent) {
      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: "Agent",
      };
    }
  }

  // 2. Try to get first ADMIN from profiles
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "ADMIN")
    .limit(1)
    .single();

  if (adminProfile) {
    // Get email from auth.users using admin client
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(
      adminProfile.id
    );

    return {
      id: adminProfile.id,
      name: adminProfile.full_name || "Administrateur",
      email: authUser?.user?.email || "",
      role: "Administrateur",
    };
  }

  // 3. Fallback: get first active agent
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, email")
    .eq("active", true)
    .limit(1)
    .single();

  if (agent) {
    return {
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: "Agent",
    };
  }

  // Default fallback
  return {
    id: null,
    name: "Sophie Martin",
    email: "",
    role: "Spécialiste LLC",
  };
}

/**
 * Crée toutes les step_instances pour les steps de type ADMIN du produit du dossier.
 * À appeler quand un dossier doit avoir ses étapes admin instanciées (ex. après paiement, ou rattrapage).
 * Ne crée que les instances manquantes (ignore les steps qui ont déjà une step_instance pour ce dossier).
 *
 * @param dossierId - ID du dossier
 * @returns Les step_instances créées et le nombre créé
 */
export async function createAdminStepInstancesForDossier(
  dossierId: string
): Promise<{
  created: number;
  step_instances: Array<{ id: string; step_id: string }>;
}> {
  const supabase = createAdminClient();

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("id, product_id")
    .eq("id", dossierId)
    .single();

  if (dossierError || !dossier) {
    throw new Error(
      `Dossier non trouvé: ${dossierError?.message || "inconnu"}`
    );
  }

  if (!dossier.product_id) {
    return { created: 0, step_instances: [] };
  }

  const { data: productSteps, error: stepsError } = await supabase
    .from("product_steps")
    .select("step_id, position, steps!inner(id, step_type)")
    .eq("product_id", dossier.product_id)
    .order("position", { ascending: true });

  if (stepsError) {
    throw new Error(
      `Erreur lors de la récupération des steps produit: ${stepsError.message}`
    );
  }

  const adminSteps = (productSteps || []).filter((ps) => {
    const step = Array.isArray(ps.steps) ? ps.steps[0] : ps.steps;
    return (step as { step_type?: string } | null)?.step_type === "ADMIN";
  });

  if (adminSteps.length === 0) {
    return { created: 0, step_instances: [] };
  }

  const { data: existingInstances } = await supabase
    .from("step_instances")
    .select("step_id")
    .eq("dossier_id", dossierId);

  const existingStepIds = new Set(
    (existingInstances || []).map((si) => si.step_id)
  );

  const toCreate = adminSteps.filter((ps) => !existingStepIds.has(ps.step_id));
  if (toCreate.length === 0) {
    return { created: 0, step_instances: [] };
  }

  const insertData = toCreate.map((ps) => ({
    dossier_id: dossierId,
    step_id: ps.step_id,
    started_at: null,
  }));

  const { data: created, error: insertError } = await supabase
    .from("step_instances")
    .insert(insertData)
    .select("id, step_id");

  if (insertError) {
    throw new Error(
      `Erreur lors de la création des step_instances: ${insertError.message}`
    );
  }

  return {
    created: created?.length ?? 0,
    step_instances: created ?? [],
  };
}
