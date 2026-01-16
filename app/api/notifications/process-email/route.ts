import { NextRequest, NextResponse } from "next/server";
import { processEmailNotification, processPendingEmailNotifications } from "@/lib/notifications/processor";

/**
 * POST /api/notifications/process-email
 * Process a single email notification or batch of pending notifications
 *
 * Body (optional):
 * - notificationId: string - Process specific notification
 * - batch: boolean - Process batch of pending notifications (default: false)
 * - limit: number - Max notifications to process in batch (default: 10)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { notificationId, batch = false, limit = 10 } = body;

    // Verify API key or authentication (add your auth logic here)
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.NOTIFICATION_API_KEY;

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (batch) {
      // Process batch of pending notifications
      const result = await processPendingEmailNotifications(limit);
      return NextResponse.json({
        success: true,
        ...result,
      });
    } else if (notificationId) {
      // Process single notification
      const result = await processEmailNotification(notificationId);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Either notificationId or batch=true must be provided" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error in process-email route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/process-email
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Email notification processor is running",
  });
}
