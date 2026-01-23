import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NotificationRule } from "@/lib/notifications/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/notification-rules/[id]/toggle
 *
 * Toggle the is_active status of a notification rule
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const supabase = createAdminClient();

    // Get current rule
    const { data: currentRule, error: fetchError } = await supabase
      .from("notification_rules")
      .select("is_active")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Notification rule not found" },
          { status: 404 }
        );
      }

      console.error("Error fetching notification rule:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch notification rule", details: fetchError.message },
        { status: 500 }
      );
    }

    // Toggle is_active
    const newIsActive = !currentRule.is_active;

    const { data, error } = await supabase
      .from("notification_rules")
      .update({ is_active: newIsActive })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling notification rule:", error);
      return NextResponse.json(
        { error: "Failed to toggle notification rule", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rule: data as NotificationRule,
      message: `Rule ${newIsActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error: any) {
    console.error("Error in POST /api/admin/notification-rules/[id]/toggle:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
