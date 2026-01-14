import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/steps/[step_id]/fields
 * Create a new step_field
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();

    const { step_id } = await params;
    const body = await request.json();

    const {
      field_key,
      label,
      description,
      placeholder,
      field_type,
      is_required,
      min_length,
      max_length,
      min_value,
      max_value,
      pattern,
      options,
      help_text,
      default_value,
      position,
    } = body;

    // Validation
    if (!field_key || !label || !field_type) {
      return NextResponse.json(
        { error: "field_key, label, and field_type are required" },
        { status: 400 }
      );
    }

    // Calculate position - if provided, check if it's available, otherwise use next available
    let fieldPosition: number;
    
    if (position !== undefined && position !== null) {
      // Check if the provided position is already taken
      const { data: existingFieldAtPosition } = await supabase
        .from("step_fields")
        .select("id")
        .eq("step_id", step_id)
        .eq("position", position)
        .single();
      
      if (existingFieldAtPosition) {
        return NextResponse.json(
          { error: `Position ${position} is already taken for this step` },
          { status: 400 }
        );
      }
      fieldPosition = position;
    } else {
      // Get the maximum position for this step to set default position
      const { data: existingFields } = await supabase
        .from("step_fields")
        .select("position")
        .eq("step_id", step_id)
        .order("position", { ascending: false })
        .limit(1);

      const maxPosition = existingFields?.[0]?.position ?? -1;
      fieldPosition = maxPosition + 1;
    }

    // Insert the new field
    const { data: newField, error: insertError } = await supabase
      .from("step_fields")
      .insert({
        step_id,
        field_key,
        label,
        description: description || null,
        placeholder: placeholder || null,
        field_type,
        is_required: is_required ?? false,
        min_length: min_length || null,
        max_length: max_length || null,
        min_value: min_value || null,
        max_value: max_value || null,
        pattern: pattern || null,
        options: options || [],
        help_text: help_text || null,
        default_value: default_value || null,
        position: fieldPosition,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating step_field:", insertError);
      return NextResponse.json(
        { error: "Failed to create step field", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ field: newField, success: true });
  } catch (error) {
    console.error("Error in POST /api/admin/steps/[step_id]/fields:", error);
    return NextResponse.json(
      { error: "Failed to create step field" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/steps/[step_id]/fields
 * Update an existing step_field
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ step_id: string }> }
) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();

    const { step_id } = await params;
    const body = await request.json();

    const {
      id,
      field_key,
      label,
      description,
      placeholder,
      field_type,
      is_required,
      min_length,
      max_length,
      min_value,
      max_value,
      pattern,
      options,
      help_text,
      default_value,
      position,
    } = body;

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: "Field id is required for update" },
        { status: 400 }
      );
    }

    // Verify the field belongs to this step
    const { data: existingField, error: fetchError } = await supabase
      .from("step_fields")
      .select("step_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingField) {
      return NextResponse.json(
        { error: "Field not found" },
        { status: 404 }
      );
    }

    if (existingField.step_id !== step_id) {
      return NextResponse.json(
        { error: "Field does not belong to this step" },
        { status: 403 }
      );
    }

    // Update the field
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (field_key !== undefined) updateData.field_key = field_key;
    if (label !== undefined) updateData.label = label;
    if (description !== undefined) updateData.description = description || null;
    if (placeholder !== undefined) updateData.placeholder = placeholder || null;
    if (field_type !== undefined) updateData.field_type = field_type;
    if (is_required !== undefined) updateData.is_required = is_required;
    if (min_length !== undefined) updateData.min_length = min_length || null;
    if (max_length !== undefined) updateData.max_length = max_length || null;
    if (min_value !== undefined) updateData.min_value = min_value || null;
    if (max_value !== undefined) updateData.max_value = max_value || null;
    if (pattern !== undefined) updateData.pattern = pattern || null;
    if (options !== undefined) updateData.options = options || [];
    if (help_text !== undefined) updateData.help_text = help_text || null;
    if (default_value !== undefined)
      updateData.default_value = default_value || null;
    if (position !== undefined) updateData.position = position;

    const { data: updatedField, error: updateError } = await supabase
      .from("step_fields")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating step_field:", updateError);
      return NextResponse.json(
        { error: "Failed to update step field", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ field: updatedField, success: true });
  } catch (error) {
    console.error("Error in PUT /api/admin/steps/[step_id]/fields:", error);
    return NextResponse.json(
      { error: "Failed to update step field" },
      { status: 500 }
    );
  }
}
