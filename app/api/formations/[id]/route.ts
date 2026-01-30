import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFormationWithElements, getUserProgress } from "@/lib/formations";

/**
 * GET /api/formations/[id]
 * Fetch a single formation with elements (client only, checks access)
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

    // Get formation with elements (checks access based on visibility rules)
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

    // Get user's progress for this formation
    const progress = await getUserProgress(user.id, formationId);

    return NextResponse.json({
      formation,
      progress: progress || null,
    });
  } catch (error) {
    console.error("[GET /api/formations/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch formation" },
      { status: 500 }
    );
  }
}
