import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getFormationWithElements,
  getUserProgress,
  updateUserProgress,
} from "@/lib/formations";
import type { UpdateProgressRequest } from "@/types/formations";

/**
 * GET /api/formations/[id]/progress
 * Get user's progress for a formation (client only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formationId } = await params;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to verify role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Only clients can access this endpoint
    if (profile.role !== "CLIENT") {
      return NextResponse.json(
        { error: "This endpoint is for clients only" },
        { status: 403 }
      );
    }

    // Verify user has access to this formation
    const formation = await getFormationWithElements(
      formationId,
      true, // checkAccess
      user.id
    );

    if (!formation) {
      return NextResponse.json(
        { error: "Formation not found or access denied" },
        { status: 404 }
      );
    }

    // Get progress
    const progress = await getUserProgress(user.id, formationId);

    return NextResponse.json({
      progress: progress || null,
    });
  } catch (error) {
    console.error("[GET /api/formations/[id]/progress] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/formations/[id]/progress
 * Update user's progress for a formation (client only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formationId } = await params;
    const body: UpdateProgressRequest = await request.json();

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to verify role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Only clients can access this endpoint
    if (profile.role !== "CLIENT") {
      return NextResponse.json(
        { error: "This endpoint is for clients only" },
        { status: 403 }
      );
    }

    // Verify user has access to this formation
    const formation = await getFormationWithElements(
      formationId,
      true, // checkAccess
      user.id
    );

    if (!formation) {
      return NextResponse.json(
        { error: "Formation not found or access denied" },
        { status: 404 }
      );
    }

    // Validate last_element_id if provided
    if (body.last_element_id) {
      const elementExists = formation.elements.some(
        (el) => el.id === body.last_element_id
      );
      if (!elementExists) {
        return NextResponse.json(
          { error: "Invalid last_element_id: element not found in this formation" },
          { status: 400 }
        );
      }
    }

    // Validate completed_element_ids if provided
    if (body.completed_element_ids && Array.isArray(body.completed_element_ids)) {
      const validElementIds = new Set(formation.elements.map((el) => el.id));
      const invalidIds = body.completed_element_ids.filter(
        (id) => !validElementIds.has(id)
      );
      if (invalidIds.length > 0) {
        return NextResponse.json(
          {
            error: "Invalid completed_element_ids: some elements not found in this formation",
            invalid_ids: invalidIds,
          },
          { status: 400 }
        );
      }
    }

    // Update progress
    await updateUserProgress(
      user.id,
      formationId,
      body.last_element_id,
      body.completed_element_ids
    );

    // Get updated progress
    const progress = await getUserProgress(user.id, formationId);

    return NextResponse.json({
      progress: progress || null,
    });
  } catch (error) {
    console.error("[POST /api/formations/[id]/progress] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/formations/[id]/progress
 * Alias for POST to support partial updates
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params });
}
