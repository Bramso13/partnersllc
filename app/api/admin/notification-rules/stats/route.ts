import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/notification-rules/stats
 *
 * Get statistics about notification rule executions for monitoring dashboard
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();

    // Get total active rules
    const { count: totalRules, error: rulesError } = await supabase
      .from("notification_rules")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (rulesError) {
      console.error("Error counting active rules:", rulesError);
    }

    // Get events created in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: eventsLast24h, error: eventsError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    if (eventsError) {
      console.error("Error counting events:", eventsError);
    }

    // Get rule executions in last 24 hours
    const { count: executionsLast24h, error: executionsError } = await supabase
      .from("notification_rule_executions")
      .select("*", { count: "exact", head: true })
      .gte("executed_at", oneDayAgo);

    if (executionsError) {
      console.error("Error counting executions:", executionsError);
    }

    // Get notifications created in last 24 hours
    const { count: notificationsLast24h, error: notificationsError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    if (notificationsError) {
      console.error("Error counting notifications:", notificationsError);
    }

    // Get recent rule executions (last 50)
    const { data: recentExecutions, error: recentError } = await supabase
      .from("notification_rule_executions")
      .select(`
        id,
        success,
        error_message,
        retry_count,
        executed_at,
        notification_rules (
          id,
          event_type,
          template_code,
          description
        ),
        events (
          id,
          event_type,
          entity_type,
          entity_id
        )
      `)
      .order("executed_at", { ascending: false })
      .limit(50);

    if (recentError) {
      console.error("Error fetching recent executions:", recentError);
    }

    // Get failed executions
    const { data: failedExecutions, error: failedError } = await supabase
      .from("notification_rule_executions")
      .select(`
        id,
        error_message,
        retry_count,
        executed_at,
        notification_rules (
          id,
          event_type,
          template_code,
          description
        ),
        events (
          id,
          event_type
        )
      `)
      .eq("success", false)
      .order("executed_at", { ascending: false })
      .limit(20);

    if (failedError) {
      console.error("Error fetching failed executions:", failedError);
    }

    // Calculate success rate for last 24h
    const { count: successfulExecutions, error: successError } = await supabase
      .from("notification_rule_executions")
      .select("*", { count: "exact", head: true })
      .eq("success", true)
      .gte("executed_at", oneDayAgo);

    if (successError) {
      console.error("Error counting successful executions:", successError);
    }

    const successRate =
      executionsLast24h && executionsLast24h > 0
        ? Math.round((successfulExecutions || 0) / executionsLast24h * 100)
        : 100;

    return NextResponse.json({
      stats: {
        total_active_rules: totalRules || 0,
        events_last_24h: eventsLast24h || 0,
        rule_executions_last_24h: executionsLast24h || 0,
        notifications_created_last_24h: notificationsLast24h || 0,
        success_rate_last_24h: successRate,
      },
      recent_executions: recentExecutions || [],
      failed_executions: failedExecutions || [],
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/notification-rules/stats:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}
