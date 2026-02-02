import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/workflow-templates/[id]
 * Get template detail with steps enriched for UI (step, document_types, custom_fields)
 * Used when applying a template to a product - returns format compatible with WorkflowStepConfig
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: template, error: templateError } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (templateError || !template) {
      if (templateError?.code === "PGRST116") {
        return NextResponse.json(
          { error: "Template non trouvé" },
          { status: 404 }
        );
      }
      console.error("[GET /api/admin/workflow-templates/[id]]", templateError);
      return NextResponse.json(
        { error: "Failed to fetch workflow template" },
        { status: 500 }
      );
    }

    const stepsJson = template.steps as Array<{
      step_id: string;
      position: number;
      is_required: boolean;
      estimated_duration_hours: number | null;
      dossier_status_on_approval: string | null;
      document_type_ids: string[];
      custom_fields: unknown[];
    }>;

    if (!Array.isArray(stepsJson) || stepsJson.length === 0) {
      return NextResponse.json({
        template: { ...template, steps: [] },
      });
    }

    // Enrich each step with step details, document_types, and format custom_fields
    const enrichedSteps = await Promise.all(
      stepsJson.map(async (stepConfig, index) => {
        // Fetch step details
        const { data: stepData } = await supabase
          .from("steps")
          .select("*")
          .eq("id", stepConfig.step_id)
          .single();

        // Fetch document types by ids
        let documentTypes: unknown[] = [];
        if (
          stepConfig.document_type_ids &&
          stepConfig.document_type_ids.length > 0
        ) {
          const { data: docTypes } = await supabase
            .from("document_types")
            .select("*")
            .in("id", stepConfig.document_type_ids);

          // Preserve order from document_type_ids
          documentTypes =
            docTypes?.sort(
              (a, b) =>
                stepConfig.document_type_ids.indexOf(a.id) -
                stepConfig.document_type_ids.indexOf(b.id)
            ) ?? [];
        }

        return {
          id: `template-${template.id}-${stepConfig.step_id}-${index}`,
          product_id: "", // Not set when loading from template - filled by UI with productId
          step_id: stepConfig.step_id,
          position: stepConfig.position,
          is_required: stepConfig.is_required ?? true,
          estimated_duration_hours: stepConfig.estimated_duration_hours ?? null,
          dossier_status_on_approval:
            stepConfig.dossier_status_on_approval ?? null,
          created_at: new Date().toISOString(),
          step: stepData ?? { id: stepConfig.step_id },
          document_types: documentTypes,
          custom_fields: stepConfig.custom_fields ?? [],
        };
      })
    );

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        steps: enrichedSteps,
        created_at: template.created_at,
        updated_at: template.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/workflow-templates/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
