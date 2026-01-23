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
  const startTime = Date.now();
  console.log("[CRON] process-event-notifications: Starting execution");

  try {
    // Verify cron secret for security
    // Read authorization from request body instead of headers
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body might be empty or invalid, continue with empty object
    }

    console.log("[CRON] Body:", body);

    const authFromBody = body.Authorization || body.authorization;
    const cronSecret = process.env.CRON_SECRET;

    console.log("[CRON] Auth check:", {
      hasAuthInBody: !!authFromBody,
      hasCronSecret: !!cronSecret,
      authPrefix: authFromBody?.substring(0, 20) + "...",
    });

    if (cronSecret && authFromBody !== `Bearer ${cronSecret}`) {
      console.error("[CRON] Unauthorized access attempt", {
        expected: `Bearer ${cronSecret?.substring(0, 10)}...`,
        received: authFromBody?.substring(0, 20) + "..." || "none",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Authentication successful, initializing Supabase client");
    const supabase = createAdminClient();

    // Get events that haven't been processed yet
    // We'll track processing via notification_rule_executions table
    const timeWindow = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    console.log("[CRON] Fetching events created after:", timeWindow);

    const { data: recentEvents, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .gte("created_at", timeWindow)
      .order("created_at", { ascending: true })
      .limit(50);

    if (eventsError) {
      console.error("[CRON] Error fetching recent events:", {
        error: eventsError,
        message: eventsError.message,
        code: eventsError.code,
        details: eventsError.details,
        hint: eventsError.hint,
      });
      return NextResponse.json(
        { error: "Failed to fetch events", details: eventsError.message },
        { status: 500 }
      );
    }

    console.log("[CRON] Fetched events:", {
      count: recentEvents?.length || 0,
      eventIds: recentEvents?.map((e) => e.id) || [],
      eventTypes: recentEvents?.map((e) => e.event_type) || [],
    });

    if (!recentEvents || recentEvents.length === 0) {
      console.log("[CRON] No events to process in the last 5 minutes");
      return NextResponse.json({
        success: true,
        message: "No events to process",
        stats: { processed: 0, succeeded: 0, failed: 0 },
      });
    }

    // Filter out events that have already been processed
    const eventsToProcess: BaseEvent[] = [];
    const alreadyProcessed: string[] = [];

    console.log("[CRON] Checking which events have already been processed...");

    for (const event of recentEvents as BaseEvent[]) {
      // Check if event has already been processed
      const { data: existingExecution, error: checkError } = await supabase
        .from("notification_rule_executions")
        .select("id")
        .eq("event_id", event.id)
        .maybeSingle();

      if (checkError) {
        console.error(
          `[CRON] Error checking execution for event ${event.id}:`,
          checkError
        );
        // Continue processing even if check fails
      }

      // Only process if no execution exists OR if there were failures
      if (!existingExecution) {
        eventsToProcess.push(event);
        console.log(
          `[CRON] Event ${event.id} (${event.event_type}) will be processed`
        );
      } else {
        alreadyProcessed.push(event.id);
        console.log(
          `[CRON] Event ${event.id} (${event.event_type}) already processed, skipping`
        );
      }
    }

    console.log("[CRON] Filtering complete:", {
      totalEvents: recentEvents.length,
      toProcess: eventsToProcess.length,
      alreadyProcessed: alreadyProcessed.length,
      alreadyProcessedIds: alreadyProcessed,
    });

    if (eventsToProcess.length === 0) {
      console.log("[CRON] All recent events already processed");
      return NextResponse.json({
        success: true,
        message: "All recent events already processed",
        stats: { processed: 0, succeeded: 0, failed: 0 },
      });
    }

    console.log(
      `[CRON] Processing ${eventsToProcess.length} events...`,
      eventsToProcess.map((e) => ({
        id: e.id,
        type: e.event_type,
        entity: `${e.entity_type}:${e.entity_id}`,
      }))
    );

    // Process each event
    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;

    for (const event of eventsToProcess) {
      const eventStartTime = Date.now();
      console.log(
        `[CRON] Processing event ${event.id}:`,
        {
          event_type: event.event_type,
          entity_type: event.entity_type,
          entity_id: event.entity_id,
          actor_type: event.actor_type,
          actor_id: event.actor_id,
          created_at: event.created_at,
          payload: JSON.stringify(event.payload).substring(0, 200),
        }
      );

      try {
        const result = await processEventForNotifications(event);
        const eventDuration = Date.now() - eventStartTime;

        totalProcessed += result.processed;
        totalSucceeded += result.succeeded;
        totalFailed += result.failed;

        console.log(
          `[CRON] Event ${event.id} (${event.event_type}) processed:`,
          {
            duration: `${eventDuration}ms`,
            rulesProcessed: result.processed,
            succeeded: result.succeeded,
            failed: result.failed,
          }
        );
      } catch (error: any) {
        const eventDuration = Date.now() - eventStartTime;
        console.error(
          `[CRON] Error processing event ${event.id} (${event.event_type}):`,
          {
            duration: `${eventDuration}ms`,
            error: error.message,
            stack: error.stack,
            errorType: error.constructor?.name,
            eventData: {
              id: event.id,
              type: event.event_type,
              entity: `${event.entity_type}:${event.entity_id}`,
            },
          }
        );
        totalFailed++;
      }
    }

    const totalDuration = Date.now() - startTime;
    const stats = {
      eventsProcessed: eventsToProcess.length,
      rulesProcessed: totalProcessed,
      succeeded: totalSucceeded,
      failed: totalFailed,
      duration: `${totalDuration}ms`,
    };

    console.log("[CRON] process-event-notifications: Execution complete", stats);

    return NextResponse.json({
      success: true,
      message: `Processed ${eventsToProcess.length} events`,
      stats,
    });
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error("[CRON] process-event-notifications: Fatal error", {
      duration: `${totalDuration}ms`,
      error: error.message,
      stack: error.stack,
      errorType: error.constructor?.name,
      errorName: error.name,
    });
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
