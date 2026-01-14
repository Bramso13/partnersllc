import { createClient } from "@/lib/supabase/server";
import { StepField } from "@/types/qualification";

export interface Step {
  id: string;
  code: string;
  label: string;
  description: string | null;
  position: number;
}

export interface DocumentType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  max_file_size_mb: number;
  allowed_extensions: string[];
}

export interface ProductStep {
  id: string;
  product_id: string;
  step_id: string;
  position: number;
  is_required: boolean;
  estimated_duration_hours: number | null;
  step: Step;
  document_types: DocumentType[];
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

  console.log(`[getProductSteps] Fetching product steps for product_id: ${productId}`);

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
      step:steps (
        id,
        code,
        label,
        description,
        position
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

  // For each product step, fetch its required document types
  const stepsWithDocuments = await Promise.all(
    (productSteps || []).map(async (ps) => {
      // Fetch document types for this product step
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
        .eq("product_step_id", ps.id);

      console.log(`[getProductSteps] Document types for product_step ${ps.id}:`, {
        count: stepDocTypes?.length || 0,
        error: docTypesError,
        stepDocTypes
      });

      const documentTypes = (stepDocTypes || [])
        .map((sdt: any) => sdt.document_type)
        .filter((dt: any) => dt !== null) as DocumentType[];

      console.log(`[getProductSteps] Filtered document types for product_step ${ps.id}:`, documentTypes);

      const mappedItem: ProductStep = {
        id: ps.id,
        product_id: ps.product_id,
        step_id: ps.step_id,
        position: ps.position,
        is_required: ps.is_required,
        estimated_duration_hours: ps.estimated_duration_hours,
        step: (Array.isArray(ps.step) ? ps.step[0] : ps.step) as Step,
        document_types: documentTypes,
      };

      if (!mappedItem.step) {
        console.warn(`[getProductSteps] Product step ${ps.id} has no step data:`, ps);
      }

      return mappedItem;
    })
  );

  console.log(`[getProductSteps] Mapped ${stepsWithDocuments.length} product steps with documents`);
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
        position
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
    step: (Array.isArray(stepInstance.step) ? stepInstance.step[0] : stepInstance.step) as Step,
  };
}
