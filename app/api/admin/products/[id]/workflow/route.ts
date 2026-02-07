import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/products/[id]/workflow
 * Fetch complete workflow configuration for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch product steps with step details (formation_id, timer_delay_minutes on steps)
    const { data: productSteps, error: stepsError } = await supabase
      .from("product_steps")
      .select(
        `
        *,
        step:steps(*, formation:formations!steps_formation_id_fkey(id, titre))
      `
      )
      .eq("product_id", id)
      .order("position");

    if (stepsError) {
      console.error("Error fetching product steps:", stepsError);
      return NextResponse.json(
        { error: "Failed to fetch workflow steps" },
        { status: 500 }
      );
    }

    // For each product step, fetch document types and custom fields
    const workflowSteps = await Promise.all(
      (productSteps || []).map(async (productStep) => {
        // Fetch document types for this step (using step_id directly)
        const { data: docTypes } = await supabase
          .from("step_document_types")
          .select(
            `
            *,
            document_type:document_types(*)
          `
          )
          .eq("step_id", productStep.step_id);

        // Fetch custom fields for this step
        const { data: customFields } = await supabase
          .from("step_fields")
          .select("*")
          .eq("step_id", productStep.step_id)
          .order("position");

        return {
          ...productStep,
          document_types:
            docTypes?.map((dt) => dt.document_type).filter(Boolean) || [],
          custom_fields: customFields || [],
        };
      })
    );

    return NextResponse.json({ steps: workflowSteps });
  } catch (error) {
    console.error("Error in GET /api/admin/products/[id]/workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow configuration" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products/[id]/workflow
 * Save complete workflow configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const body = await request.json();
    const { steps } = body; // Array of { step_id, position, document_type_ids, custom_fields }

    console.log("Saving workflow for product:", id);
    console.log("Steps data:", JSON.stringify(steps, null, 2));

    const supabase = await createClient();

    // Delete existing workflow configuration
    await supabase.from("product_steps").delete().eq("product_id", id);

    // Create new product steps
    // formation_id and timer_delay_minutes are on steps, not product_steps
    const productStepsToInsert = steps.map(
      (step: {
        step_id: string;
        position: number;
        is_required?: boolean;
        estimated_duration_hours?: number;
        dossier_status_on_approval?: string | null;
      }) => ({
        product_id: id,
        step_id: step.step_id,
        position: step.position,
        is_required: step.is_required ?? true,
        estimated_duration_hours: step.estimated_duration_hours || null,
        dossier_status_on_approval: step.dossier_status_on_approval || null,
      })
    );

    const { data: createdProductSteps, error: productStepsError } =
      await supabase
        .from("product_steps")
        .insert(productStepsToInsert)
        .select();

    if (productStepsError) {
      console.error("Error creating product steps:", productStepsError);
      return NextResponse.json(
        { error: "Failed to save workflow steps" },
        { status: 500 }
      );
    }

    // Create document type associations and custom fields
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Insert document types (using step_id directly with upsert to avoid duplicates)
      if (step.document_type_ids && step.document_type_ids.length > 0) {
        console.log(
          `Upserting document types for step_id ${step.step_id}:`,
          step.document_type_ids
        );

        const docTypesToUpsert = step.document_type_ids.map(
          (docTypeId: string) => ({
            step_id: step.step_id,
            document_type_id: docTypeId,
          })
        );

        const { error: docTypesError } = await supabase
          .from("step_document_types")
          .upsert(docTypesToUpsert, {
            onConflict: "step_id,document_type_id",
            ignoreDuplicates: true,
          });

        if (docTypesError) {
          console.error("Error upserting document types:", docTypesError);
          return NextResponse.json(
            { error: "Failed to save document types for workflow steps" },
            { status: 500 }
          );
        }

        console.log(
          `Successfully upserted ${step.document_type_ids.length} document types`
        );
      } else {
        console.log(`No document types to upsert for step_id ${step.step_id}`);
      }

      // Insert custom fields
      if (step.custom_fields && step.custom_fields.length > 0) {
        const fieldsToInsert = step.custom_fields.map(
          (
            field: {
              field_key: string;
              label: string;
              field_type: string;
              position: number;
              [key: string]: unknown;
            },
            index: number
          ) => ({
            step_id: step.step_id,
            field_key: field.field_key,
            label: field.label,
            description: field.description || null,
            placeholder: field.placeholder || null,
            field_type: field.field_type,
            is_required: field.is_required || false,
            min_length: field.min_length || null,
            max_length: field.max_length || null,
            min_value: field.min_value || null,
            max_value: field.max_value || null,
            pattern: field.pattern || null,
            options: field.options || [],
            help_text: field.help_text || null,
            default_value: field.default_value || null,
            position: field.position ?? index,
          })
        );

        // Delete existing fields for this step first
        await supabase.from("step_fields").delete().eq("step_id", step.step_id);

        await supabase.from("step_fields").insert(fieldsToInsert);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/admin/products/[id]/workflow:", error);
    return NextResponse.json(
      { error: "Failed to save workflow configuration" },
      { status: 500 }
    );
  }
}
