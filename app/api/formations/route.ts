import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessibleFormations } from "@/lib/formations";

/**
 * GET /api/formations
 * Fetch formations accessible to the current user (client only)
 */
export async function GET() {
  try {
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
    // (Admins and agents should use admin routes if needed)
    if (profile.role !== "CLIENT") {
      return NextResponse.json(
        { error: "This endpoint is for clients only" },
        { status: 403 }
      );
    }

    // Get accessible formations based on visibility rules
    const formations = await getAccessibleFormations(user.id);

    return NextResponse.json({ formations });
  } catch (error) {
    console.error("[GET /api/formations] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch formations" },
      { status: 500 }
    );
  }
}
