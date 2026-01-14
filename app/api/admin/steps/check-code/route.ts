import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/steps/check-code
 * Check if a step code already exists
 */
export async function GET(request: Request) {
  try {
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("steps")
      .select("id")
      .eq("code", code)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking code:", error);
      return NextResponse.json(
        { error: "Failed to check code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ exists: !!data });
  } catch (error) {
    console.error("Error in GET /api/admin/steps/check-code:", error);
    return NextResponse.json(
      { error: "Failed to check code" },
      { status: 500 }
    );
  }
}
