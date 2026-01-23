import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NotificationRule, NotificationChannel } from "@/lib/notifications/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/notification-rules/[id]
 *
 * Get a single notification rule by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("notification_rules")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Notification rule not found" },
          { status: 404 }
        );
      }

      console.error("Error fetching notification rule:", error);
      return NextResponse.json(
        { error: "Failed to fetch notification rule", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data as NotificationRule);
  } catch (error: any) {
    console.error("Error in GET /api/admin/notification-rules/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

/**
 * PUT /api/admin/notification-rules/[id]
 *
 * Update a notification rule
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const supabase = createAdminClient();

    const body = await request.json();

    // Extract fields that can be updated
    const {
      event_type,
      template_code,
      channels,
      is_active,
      priority,
      conditions,
      description,
    } = body;

    // Build update object (only include fields that are provided)
    const updates: Partial<NotificationRule> = {};

    if (event_type !== undefined) updates.event_type = event_type;
    if (template_code !== undefined) updates.template_code = template_code;
    if (channels !== undefined) {
      // Validate channels
      const validChannels: NotificationChannel[] = ["EMAIL", "WHATSAPP", "IN_APP", "SMS"];
      if (!Array.isArray(channels) || channels.length === 0) {
        return NextResponse.json(
          { error: "Channels must be a non-empty array" },
          { status: 400 }
        );
      }

      for (const channel of channels) {
        if (!validChannels.includes(channel)) {
          return NextResponse.json(
            {
              error: `Invalid channel: ${channel}`,
              validChannels,
            },
            { status: 400 }
          );
        }
      }

      updates.channels = channels;
    }
    if (is_active !== undefined) updates.is_active = is_active;
    if (priority !== undefined) {
      // Validate priority
      if (typeof priority !== "number" || priority < 0) {
        return NextResponse.json(
          { error: "Priority must be a non-negative number" },
          { status: 400 }
        );
      }
      updates.priority = priority;
    }
    if (conditions !== undefined) updates.conditions = conditions;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update rule
    const { data, error } = await supabase
      .from("notification_rules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Notification rule not found" },
          { status: 404 }
        );
      }

      console.error("Error updating notification rule:", error);
      return NextResponse.json(
        { error: "Failed to update notification rule", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data as NotificationRule);
  } catch (error: any) {
    console.error("Error in PUT /api/admin/notification-rules/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE /api/admin/notification-rules/[id]
 *
 * Delete a notification rule
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("notification_rules")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Notification rule not found" },
          { status: 404 }
        );
      }

      console.error("Error deleting notification rule:", error);
      return NextResponse.json(
        { error: "Failed to delete notification rule", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Rule deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/admin/notification-rules/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
