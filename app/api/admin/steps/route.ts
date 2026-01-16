import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Validation regex for UPPER_SNAKE_CASE
const UPPER_SNAKE_CASE_REGEX = /^[A-Z][A-Z0-9_]*$/;

/**
 * GET /api/admin/steps
 * Fetch all available workflow steps
 */
export async function GET() {
  try {
    await requireAdminAuth();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("steps")
      .select("*")
      .order("position");

    if (error) {
      console.error("Error fetching steps:", error);
      return NextResponse.json(
        { error: "Failed to fetch steps" },
        { status: 500 }
      );
    }

    return NextResponse.json({ steps: data });
  } catch (error) {
    console.error("Error in GET /api/admin/steps:", error);
    return NextResponse.json(
      { error: "Failed to fetch steps" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/steps
 * Create a new workflow step
 */
export async function POST(request: Request) {
  try {
    await requireAdminAuth();

    const supabase = await createClient();
    const body = await request.json();

    const { code, label, description, position, step_type } = body;

    // Validate required fields
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required", details: { field: "code", message: "Code is required" } },
        { status: 400 }
      );
    }

    if (!label || typeof label !== "string") {
      return NextResponse.json(
        { error: "Label is required", details: { field: "label", message: "Label is required" } },
        { status: 400 }
      );
    }

    // Validate code format
    if (code.length < 3) {
      return NextResponse.json(
        { error: "Code must be at least 3 characters", details: { field: "code", message: "Code must be at least 3 characters" } },
        { status: 400 }
      );
    }

    if (code.length > 50) {
      return NextResponse.json(
        { error: "Code must not exceed 50 characters", details: { field: "code", message: "Code must not exceed 50 characters" } },
        { status: 400 }
      );
    }

    if (!UPPER_SNAKE_CASE_REGEX.test(code)) {
      return NextResponse.json(
        { error: "Code must be in UPPER_SNAKE_CASE format", details: { field: "code", message: "Code must be in UPPER_SNAKE_CASE format (e.g., MY_CUSTOM_STEP)" } },
        { status: 400 }
      );
    }

    // Validate label
    if (label.length < 2) {
      return NextResponse.json(
        { error: "Label must be at least 2 characters", details: { field: "label", message: "Label must be at least 2 characters" } },
        { status: 400 }
      );
    }

    if (label.length > 100) {
      return NextResponse.json(
        { error: "Label must not exceed 100 characters", details: { field: "label", message: "Label must not exceed 100 characters" } },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description && typeof description === "string" && description.length > 500) {
      return NextResponse.json(
        { error: "Description must not exceed 500 characters", details: { field: "description", message: "Description must not exceed 500 characters" } },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const { data: existingStep, error: checkError } = await supabase
      .from("steps")
      .select("id")
      .eq("code", code)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking code uniqueness:", checkError);
      return NextResponse.json(
        { error: "Failed to validate code uniqueness" },
        { status: 500 }
      );
    }

    if (existingStep) {
      return NextResponse.json(
        { error: "Code already exists", details: { field: "code", message: "This code already exists. Please choose a unique code." } },
        { status: 409 }
      );
    }

    // Determine position
    let finalPosition = position;

    if (position === undefined || position === null || position === "") {
      // Auto-calculate position
      const { data: maxPositionData, error: maxError } = await supabase
        .from("steps")
        .select("position")
        .order("position", { ascending: false })
        .limit(1)
        .single();

      if (maxError && maxError.code !== "PGRST116") {
        console.error("Error fetching max position:", maxError);
        // Default to 0 if no steps exist
        finalPosition = 0;
      } else {
        finalPosition = maxPositionData ? maxPositionData.position + 1 : 0;
      }
    } else {
      // Validate provided position is a number
      finalPosition = parseInt(position);
      if (isNaN(finalPosition)) {
        return NextResponse.json(
          { error: "Position must be a number", details: { field: "position", message: "Position must be a number" } },
          { status: 400 }
        );
      }

      // Check position uniqueness
      const { data: existingPosition, error: posError } = await supabase
        .from("steps")
        .select("id")
        .eq("position", finalPosition)
        .single();

      if (posError && posError.code !== "PGRST116") {
        console.error("Error checking position uniqueness:", posError);
      }

      if (existingPosition) {
        return NextResponse.json(
          { error: "Position already taken", details: { field: "position", message: "This position is already taken. Leave empty for automatic positioning." } },
          { status: 409 }
        );
      }
    }

    // Validate step_type if provided
    const validStepType = step_type === "ADMIN" ? "ADMIN" : "CLIENT";

    // Insert step
    const { data: newStep, error: insertError } = await supabase
      .from("steps")
      .insert({
        code,
        label,
        description: description || null,
        position: finalPosition,
        step_type: validStepType,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting step:", insertError);
      return NextResponse.json(
        { error: "Failed to create step" },
        { status: 500 }
      );
    }

    return NextResponse.json({ step: newStep }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/steps:", error);
    return NextResponse.json(
      { error: "Failed to create step" },
      { status: 500 }
    );
  }
}
