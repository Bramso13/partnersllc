import type { SupabaseClient } from "@supabase/supabase-js";
import type { Step, DocumentType, FormationSummary, ProductStep } from "./types";

export async function fetchDocumentTypesForStep(
  supabase: SupabaseClient,
  stepId: string
): Promise<DocumentType[]> {
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
    .eq("step_id", stepId);

  if (docTypesError) {
    console.error("Error fetching document types:", docTypesError);
    return [];
  }

  const documentTypes = (stepDocTypes || [])
    .map((sdt: { document_type: DocumentType[] | null }) => sdt.document_type)
    .filter((dt: DocumentType[] | null): dt is DocumentType[] => dt !== null)
    .flat();

  return documentTypes;
}

export function mapStepToFormation(
  step: Step & { formation?: unknown }
): FormationSummary | null {
  const formation = step.formation;

  if (!formation) return null;

  if (Array.isArray(formation) && formation[0]) {
    return {
      id: (formation[0] as { id: string }).id,
      titre: (formation[0] as { titre: string }).titre,
    };
  }

  if (typeof formation === "object" && !Array.isArray(formation)) {
    return {
      id: (formation as { id: string }).id,
      titre: (formation as { titre: string }).titre,
    };
  }

  return null;
}

export function mapProductStep(
  ps: Record<string, unknown>,
  step: Step,
  documentTypes: DocumentType[],
  formation: FormationSummary | null
): ProductStep {
  return {
    id: ps.id as string,
    product_id: ps.product_id as string,
    step_id: ps.step_id as string,
    position: ps.position as number,
    is_required: ps.is_required as boolean,
    estimated_duration_hours: ps.estimated_duration_hours as number | null,
    dossier_status_on_approval: (ps.dossier_status_on_approval as string | null) ?? null,
    formation_id: step.formation_id ?? null,
    timer_delay_minutes: step.timer_delay_minutes ?? null,
    step,
    document_types: documentTypes,
    formation: formation ?? null,
  };
}
