import { createAdminClient } from "@/lib/supabase/server";
import type {
  DossierWithDetailsAndClient,
  Product,
  Step,
  StepInstance,
} from "@/types/dossiers";
import { calculateProgress } from "../shared";

interface EnrichedStepInstance extends StepInstance {
  step: Step | null;
}

export async function getAll(): Promise<DossierWithDetailsAndClient[]> {
  console.log("🔍 [getAllAdminDossiers] Starting...");
  const supabase = createAdminClient();

  console.log("🔍 [getAllAdminDossiers] Fetching dossiers...");
  const { data: dossiers, error: dossiersError } = await supabase
    .from("dossiers")
    .select("*")
    .order("created_at", { ascending: false });

  if (dossiersError) {
    console.error("❌ [getAllAdminDossiers] Error fetching dossiers:", dossiersError);
    throw dossiersError;
  }

  console.log("✅ [getAllAdminDossiers] Dossiers fetched:", dossiers?.length || 0);

  if (!dossiers || dossiers.length === 0) {
    console.log("⚠️ [getAllAdminDossiers] No dossiers found");
    return [];
  }

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

  console.log("🔍 [getAllAdminDossiers] Fetching profiles...");
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  console.log("✅ [getAllAdminDossiers] Profiles fetched:", users?.length || 0);

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

    console.log("✅ [getAllAdminDossiers] Agents fetched:", agents?.length || 0);

    (agents || []).forEach((a) => {
      agentsMap.set(a.id, {
        id: a.id,
        email: emailMap.get(a.id) || "",
        full_name: a.full_name,
      });
    });
  }

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

  const dossiersWithDetails = await Promise.all(
    dossiers.map(async (dossier) => {
      let product: Product | null = null;
      if (dossier.product_id) {
        const { data: productData } = await supabase
          .from("products")
          .select("id, name, description")
          .eq("id", dossier.product_id)
          .single();
        product = productData as Product | null;
      }

      const { data: stepInstances } = await supabase
        .from("step_instances")
        .select("*")
        .eq("dossier_id", dossier.id)
        .order("started_at", { ascending: true });

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
          } as EnrichedStepInstance;
        })
      );

      let currentStepInstance: EnrichedStepInstance | null = null;
      if (dossier.current_step_instance_id) {
        const currentSi = stepInstancesWithSteps.find(
          (si) => si.id === dossier.current_step_instance_id
        );
        if (currentSi) {
          currentStepInstance = currentSi;
        }
      }

      const { completedSteps, totalSteps, progressPercentage } =
        calculateProgress(stepInstancesWithSteps);

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

  return dossiersWithDetails;
}
