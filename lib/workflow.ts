import { createClient } from "@/lib/supabase/server";
import { StepField } from "@/types/qualification";

export type StepType = "CLIENT" | "ADMIN" | "FORMATION" | "TIMER";

export interface Step {
  id: string;
  code: string;
  label: string;
  description: string | null;
  position: number;
  step_type?: StepType;
  formation_id?: string | null;
  timer_delay_minutes?: number | null;
}

export interface DocumentType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  max_file_size_mb: number;
  allowed_extensions: string[];
}

export interface FormationSummary {
  id: string;
  titre: string;
}

export interface ProductStep {
  id: string;
  product_id: string;
  step_id: string;
  position: number;
  is_required: boolean;
  estimated_duration_hours: number | null;
  /** Optional dossier status to apply when this step is approved (admin workflow config). */
  dossier_status_on_approval?: string | null;
  /** For step_type FORMATION: which formation to display. */
  formation_id?: string | null;
  /** For step_type TIMER: delay in minutes before next step is available. */
  timer_delay_minutes?: number | null;
  step: Step;
  document_types: DocumentType[];
  /** For step_type FORMATION: formation details (id, titre). */
  formation?: FormationSummary | null;
}

export interface ProductWithSteps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  steps: ProductStep[];
}

/**
 * Get all steps for a product with their details and required documents
 */
export async function getProductSteps(
  productId: string
): Promise<ProductStep[]> {
  const supabase = await createClient();

  console.log(
    `[getProductSteps] Fetching product steps for product_id: ${productId}`
  );

  // formation_id and timer_delay_minutes are on steps, not product_steps
  const { data: productSteps, error } = await supabase
    .from("product_steps")
    .select(
      `
      id,
      product_id,
      step_id,
      position,
      is_required,
      estimated_duration_hours,
      dossier_status_on_approval,
      step:steps (
        id,
        code,
        label,
        description,
        position,
        step_type,
        formation_id,
        timer_delay_minutes,
        formation:formations!steps_formation_id_fkey(id, titre)
      )
    `
    )
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[getProductSteps] Error fetching product steps:", error);
    throw error;
  }

  console.log(`[getProductSteps] Raw response:`, {
    count: productSteps?.length || 0,
    firstItem: productSteps?.[0] || null,
  });

  // For each product step, fetch its required document types via step_id
  const stepsWithDocuments = await Promise.all(
    (productSteps || []).map(async (ps) => {
      const step = (Array.isArray(ps.step) ? ps.step[0] : ps.step) as Step;

      // Fetch document types for this step (using step_id directly)
      const { data: stepDocTypes, error: docTypesError } = await supabase
        .from("step_document_types")
        .select(
          `
          document_type:document_types (
            id,
            code,
            label,
            description,
            max_file_size_mb,
            allowed_extensions
          )
        `
        )
        .eq("step_id", step.id);

      console.log(`[getProductSteps] Document types for step ${step.id}:`, {
        count: stepDocTypes?.length || 0,
        error: docTypesError,
        stepDocTypes,
      });

      const documentTypes = (stepDocTypes || [])
        .map((sdt: any) => sdt.document_type)
        .filter((dt: any) => dt !== null) as DocumentType[];

      console.log(
        `[getProductSteps] Filtered document types for step ${step.id}:`,
        documentTypes
      );

      // formation_id, timer_delay_minutes, formation are on step (steps table)
      const stepWithFormation = step as Step & {
        formation_id?: string | null;
        timer_delay_minutes?: number | null;
        formation?: unknown;
      };
      const formation = stepWithFormation.formation;
      const formationSummary =
        Array.isArray(formation) && formation[0]
          ? {
              id: (formation[0] as { id: string }).id,
              titre: (formation[0] as { titre: string }).titre,
            }
          : formation &&
              typeof formation === "object" &&
              !Array.isArray(formation)
            ? {
                id: (formation as { id: string }).id,
                titre: (formation as { titre: string }).titre,
              }
            : null;

      const mappedItem: ProductStep = {
        id: ps.id,
        product_id: ps.product_id,
        step_id: ps.step_id,
        position: ps.position,
        is_required: ps.is_required,
        estimated_duration_hours: ps.estimated_duration_hours,
        dossier_status_on_approval: ps.dossier_status_on_approval ?? null,
        formation_id: stepWithFormation.formation_id ?? null,
        timer_delay_minutes: stepWithFormation.timer_delay_minutes ?? null,
        step: step,
        document_types: documentTypes,
        formation: formationSummary ?? null,
      };

      if (!mappedItem.step) {
        console.warn(
          `[getProductSteps] Product step ${ps.id} has no step data:`,
          ps
        );
      }

      return mappedItem;
    })
  );

  console.log(
    `[getProductSteps] Mapped ${stepsWithDocuments.length} product steps with documents`
  );
  return stepsWithDocuments;
}

/**
 * Get step fields for a specific step
 */
export async function getStepFields(stepId: string): Promise<StepField[]> {
  const supabase = await createClient();

  const { data: stepFields, error } = await supabase
    .from("step_fields")
    .select("*")
    .eq("step_id", stepId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching step fields:", error);
    throw error;
  }

  // Transform options if they're stored as JSONB
  const fields = (stepFields || []).map((field) => {
    let options = field.options;
    if (options && typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch {
        options = null;
      }
    }
    // If options is an array of strings, convert to {value, label} format
    if (Array.isArray(options) && options.length > 0) {
      if (typeof options[0] === "string") {
        options = options.map((opt) => ({ value: opt, label: opt }));
      }
    }

    return {
      ...field,
      options: options || null,
    } as StepField;
  });

  return fields;
}

/**
 * Get current step instance for a dossier
 */
export async function getCurrentStepInstance(dossierId: string) {
  const supabase = await createClient();

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("current_step_instance_id")
    .eq("id", dossierId)
    .single();

  if (!dossier?.current_step_instance_id) {
    return null;
  }

  const { data: stepInstance, error } = await supabase
    .from("step_instances")
    .select(
      `
      id,
      dossier_id,
      step_id,
      started_at,
      completed_at,
      step:steps (
        id,
        code,
        label,
        description,
        position,
        step_type
      )
    `
    )
    .eq("id", dossier.current_step_instance_id)
    .single();

  if (error) {
    console.error("Error fetching step instance:", error);
    return null;
  }

  return {
    ...stepInstance,
    step: (Array.isArray(stepInstance.step)
      ? stepInstance.step[0]
      : stepInstance.step) as Step,
  };
}
