import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(100, "Le nom ne doit pas dépasser 100 caractères")
    .trim(),
  steps: z.array(
    z.object({
      step_id: z.string().uuid(),
      position: z.number().int().min(0),
      is_required: z.boolean().optional().default(true),
      estimated_duration_hours: z.number().nullable().optional(),
      dossier_status_on_approval: z.string().nullable().optional(),
      document_type_ids: z.array(z.string().uuid()).optional().default([]),
      custom_fields: z
        .array(z.record(z.string(), z.unknown()))
        .optional()
        .default([]),
    })
  ),
});

/**
 * GET /api/admin/workflow-templates
 * List all workflow templates (id, name, step count, created_at)
 */
export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("workflow_templates")
      .select("id, name, steps, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/workflow-templates]", error);
      return NextResponse.json(
        { error: "Failed to fetch workflow templates" },
        { status: 500 }
      );
    }

    // Transform to include step count
    const templates = (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      step_count: Array.isArray(t.steps) ? t.steps.length : 0,
      created_at: t.created_at,
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error in GET /api/admin/workflow-templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/workflow-templates
 * Create a new workflow template
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body: unknown = await request.json();
    const parseResult = CreateTemplateSchema.safeParse(body);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      const message = firstIssue?.message ?? "Données invalides";
      const field = firstIssue?.path?.[0];
      return NextResponse.json(
        {
          error: message,
          details: { field, message: firstIssue?.message },
        },
        { status: 400 }
      );
    }

    const { name, steps } = parseResult.data;

    const supabase = createAdminClient();

    // Check name uniqueness
    const { data: existing } = await supabase
      .from("workflow_templates")
      .select("id")
      .eq("name", name)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: "Un template avec ce nom existe déjà",
          details: { field: "name", message: "Ce nom est déjà utilisé" },
        },
        { status: 409 }
      );
    }

    const { data: template, error } = await supabase
      .from("workflow_templates")
      .insert({ name, steps })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/admin/workflow-templates]", error);
      return NextResponse.json(
        { error: "Failed to create workflow template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/workflow-templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
