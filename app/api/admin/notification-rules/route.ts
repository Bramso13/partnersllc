import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NotificationRule, NotificationChannel } from "@/lib/notifications/types";
import { EventType } from "@/lib/events";

/**
 * GET /api/admin/notification-rules
 *
 * List all notification rules with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get("event_type");
    const isActive = searchParams.get("is_active");
    const channel = searchParams.get("channel");

    // Build query
    let query = supabase.from("notification_rules").select("*", { count: "exact" });

    // Apply filters
    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    if (channel) {
      query = query.contains("channels", [channel]);
    }

    // Execute query with sorting
    const { data, error, count } = await query.order("priority", {
      ascending: false,
    }).order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notification rules:", error);
      return NextResponse.json(
        { error: "Failed to fetch notification rules", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rules: data as NotificationRule[],
      total: count || 0,
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/notification-rules:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/admin/notification-rules
 *
 * Create a new notification rule
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();

    const body = await request.json();

    // Validate required fields
    const {
      event_type,
      template_code,
      channels,
      is_active = true,
      priority = 0,
      conditions = null,
      description,
    } = body;

    if (!event_type || !template_code || !channels || !description) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["event_type", "template_code", "channels", "description"],
        },
        { status: 400 }
      );
    }

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

    // Validate priority
    if (typeof priority !== "number" || priority < 0) {
      return NextResponse.json(
        { error: "Priority must be a non-negative number" },
        { status: 400 }
      );
    }

    // Create rule
    const { data, error } = await supabase
      .from("notification_rules")
      .insert({
        event_type,
        template_code,
        channels,
        is_active,
        priority,
        conditions,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification rule:", error);
      return NextResponse.json(
        { error: "Failed to create notification rule", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data as NotificationRule, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/admin/notification-rules:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
