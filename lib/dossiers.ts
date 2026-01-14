import { createClient, createAdminClient } from "@/lib/supabase/server";

export type DossierStatus =
  | "QUALIFICATION"
  | "FORM_SUBMITTED"
  | "NM_PENDING"
  | "LLC_ACCEPTED"
  | "EIN_PENDING"
  | "BANK_PREPARATION"
  | "BANK_OPENED"
  | "WAITING_48H"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "CLOSED"
  | "ERROR";

export type DossierType = "LLC" | "CORP" | "BANKING";

export interface Dossier {
  id: string;
  user_id: string;
  product_id: string | null;
  type: DossierType;
  status: DossierStatus;
  current_step_instance_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Step {
  id: string;
  code: string;
  label: string | null;
  position: number;
}

export interface StepInstance {
  id: string;
  dossier_id: string;
  step_id: string;
  started_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  validation_status?:
    | "DRAFT"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED";
  rejection_reason?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
}

export interface DocumentType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  required_step_id: string | null;
  max_file_size_mb: number | null;
  allowed_extensions: string[] | null;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_type: string | null;
  actor_id: string | null;
  payload: Record<string, any>;
  created_at: string;
}

export interface DossierWithDetails extends Dossier {
  product?: Product | null;
  current_step_instance?: (StepInstance & { step?: Step | null }) | null;
  step_instances?: (StepInstance & { step?: Step | null })[];
  completed_steps_count?: number;
  total_steps_count?: number;
  progress_percentage?: number;
  required_documents?: DocumentType[];
  timeline_events?: TimelineEvent[];
}

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
 * Extended interface for admin dossiers view with client information
 */
export interface DossierWithDetailsAndClient extends DossierWithDetails {
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  assigned_agent?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  pending_documents_count?: number;
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
