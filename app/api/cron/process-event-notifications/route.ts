import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { processEventForNotifications } from "@/lib/notifications/orchestrator";
import { BaseEvent } from "@/lib/events";

/**
 * POST /api/cron/process-event-notifications
 *
 * Story 3.9: Event-to-Notification Orchestration System
 *
 * This endpoint processes events and triggers notifications based on notification rules.
 * It should be called:
 * - Via a cron job (e.g., Vercel Cron, every 10 seconds)
 * - Via a database webhook (when events are inserted)
 * - Manually by admin for testing/recovery
 *
 * Security: Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get events that haven't been processed yet
    // We'll track processing via notification_rule_executions table
    const { data: recentEvents, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - 5 * 60 * 1000).toISOString() // Last 5 minutes
      )
      .order("created_at", { ascending: true })
      .limit(50);

    if (eventsError) {
      console.error("Error fetching recent events:", eventsError);
      return NextResponse.json(
        { error: "Failed to fetch events", details: eventsError.message },
        { status: 500 }
      );
    }

    if (!recentEvents || recentEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No events to process",
        stats: { processed: 0, succeeded: 0, failed: 0 },
      });
    }

    // Filter out events that have already been processed
    const eventsToProcess: BaseEvent[] = [];

    for (const event of recentEvents as BaseEvent[]) {
      // Check if event has already been processed
      const { data: existingExecution } = await supabase
        .from("notification_rule_executions")
        .select("id")
        .eq("event_id", event.id)
        .maybeSingle();

      // Only process if no execution exists OR if there were failures
      if (!existingExecution) {
        eventsToProcess.push(event);
      }
    }

    if (eventsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All recent events already processed",
        stats: { processed: 0, succeeded: 0, failed: 0 },
      });
    }

    console.log(`Processing ${eventsToProcess.length} events...`);

    // Process each event
    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;

    for (const event of eventsToProcess) {
      try {
        const result = await processEventForNotifications(event);
        totalProcessed += result.processed;
        totalSucceeded += result.succeeded;
        totalFailed += result.failed;

        console.log(
          `Processed event ${event.id} (${event.event_type}): ${result.succeeded} succeeded, ${result.failed} failed`
        );
      } catch (error: any) {
        console.error(`Error processing event ${event.id}:`, error);
        totalFailed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${eventsToProcess.length} events`,
      stats: {
        eventsProcessed: eventsToProcess.length,
        rulesProcessed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed,
      },
    });
  } catch (error: any) {
    console.error("Error in process-event-notifications cron:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-event-notifications
 *
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    endpoint: "process-event-notifications",
    description: "Event-to-notification orchestration processor",
  });
}
