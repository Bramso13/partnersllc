import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Dossier,
  Product,
  Step,
  StepInstance,
  DocumentType,
  TimelineEvent,
} from "@/types/dossiers";

export interface EnrichedStepInstance extends StepInstance {
  step: Step | null;
}

export function calculateProgress(
  stepInstances: EnrichedStepInstance[]
): {
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
} {
  const completedSteps = stepInstances.filter(
    (si) => si.completed_at !== null
  ).length;
  const totalSteps = stepInstances.length;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return { completedSteps, totalSteps, progressPercentage };
}

export async function fetchProduct(
  supabase: SupabaseClient,
  productId: string | null
): Promise<Product | null> {
  if (!productId) return null;

  const { data: productData } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  return productData as Product | null;
}

export async function fetchStepInstances(
  supabase: SupabaseClient,
  dossierId: string
): Promise<EnrichedStepInstance[]> {
  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("*")
    .eq("dossier_id", dossierId);

  if (!stepInstances || stepInstances.length === 0) {
    return [];
  }

  const stepInstancesWithSteps = await Promise.all(
    stepInstances.map(async (si) => {
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

  return stepInstancesWithSteps;
}

export async function fetchCurrentStepInstance(
  supabase: SupabaseClient,
  currentStepInstanceId: string | null
): Promise<(StepInstance & { step: Step | null }) | null> {
  if (!currentStepInstanceId) return null;

  const { data: currentSi } = await supabase
    .from("step_instances")
    .select("*")
    .eq("id", currentStepInstanceId)
    .single();

  if (!currentSi) return null;

  const { data: currentStep } = await supabase
    .from("steps")
    .select("*")
    .eq("id", currentSi.step_id)
    .single();

  return {
    ...currentSi,
    step: currentStep as Step | null,
  };
}

export async function fetchRequiredDocuments(
  supabase: SupabaseClient,
  stepId: string | null
): Promise<DocumentType[]> {
  if (!stepId) return [];

  const { data: documentTypes } = await supabase
    .from("document_types")
    .select("*")
    .eq("required_step_id", stepId);

  return (documentTypes || []) as DocumentType[];
}

export async function fetchTimelineEvents(
  supabase: SupabaseClient,
  dossierId: string
): Promise<TimelineEvent[]> {
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("entity_type", "dossier")
    .eq("entity_id", dossierId)
    .order("created_at", { ascending: true });

  return (events || []) as TimelineEvent[];
}

export interface DossierEnrichmentOptions {
  includeProduct?: boolean;
  includeStepInstances?: boolean;
  includeCurrentStep?: boolean;
  includeRequiredDocuments?: boolean;
  includeTimelineEvents?: boolean;
}

export async function enrichDossierWithDetails(
  supabase: SupabaseClient,
  dossier: Dossier,
  options: DossierEnrichmentOptions = {}
): Promise<Record<string, unknown>> {
  const {
    includeProduct = true,
    includeStepInstances = true,
    includeCurrentStep = true,
    includeRequiredDocuments = true,
    includeTimelineEvents = true,
  } = options;

  let product: Product | null = null;
  if (includeProduct && dossier.product_id) {
    product = await fetchProduct(supabase, dossier.product_id);
  }

  let stepInstancesWithSteps: EnrichedStepInstance[] = [];
  if (includeStepInstances) {
    stepInstancesWithSteps = await fetchStepInstances(supabase, dossier.id);
  }

  let currentStepInstance: (StepInstance & { step: Step | null }) | null = null;
  if (includeCurrentStep && dossier.current_step_instance_id) {
    currentStepInstance = await fetchCurrentStepInstance(
      supabase,
      dossier.current_step_instance_id
    );
  }

  const { completedSteps, totalSteps, progressPercentage } =
    calculateProgress(stepInstancesWithSteps);

  let requiredDocuments: DocumentType[] = [];
  if (includeRequiredDocuments && currentStepInstance?.step?.id) {
    requiredDocuments = await fetchRequiredDocuments(
      supabase,
      currentStepInstance.step.id
    );
  }

  let timelineEvents: TimelineEvent[] = [];
  if (includeTimelineEvents) {
    timelineEvents = await fetchTimelineEvents(supabase, dossier.id);
  }

  return {
    ...dossier,
    product,
    current_step_instance: currentStepInstance,
    step_instances: stepInstancesWithSteps,
    completed_steps_count: completedSteps,
    total_steps_count: totalSteps,
    progress_percentage: progressPercentage,
    required_documents: requiredDocuments,
    timeline_events: timelineEvents,
  };
}
