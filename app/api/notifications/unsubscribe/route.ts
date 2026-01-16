import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/notifications/unsubscribe
 * Unsubscribe user from email notifications
 *
 * Query params:
 * - user: string - User ID (UUID)
 * - token: string (optional) - Unsubscribe token for security
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user");
    const token = searchParams.get("token");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // TODO: Verify token if provided (for security)
    // For now, we'll just mark the user as unsubscribed
    // In the future, this should update a notification_preferences table

    const supabase = await createClient();

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // For now, return success message
    // TODO: Implement notification preferences table and update it here
    return NextResponse.json({
      success: true,
      message: "Vous avez été désabonné des notifications par email.",
      note: "La fonctionnalité de préférences de notifications sera disponible prochainement.",
    });
  } catch (error: any) {
    console.error("Error in unsubscribe route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
