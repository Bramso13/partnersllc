import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

interface NotificationDelivery {
  id: string;
  channel: string;
  status: string;
  recipient: string;
  provider_response: Record<string, unknown> | null;
  sent_at: string | null;
  failed_at: string | null;
  created_at: string;
}

/**
 * GET /api/admin/notifications
 * Récupère les notifications avec leurs deliveries et infos client
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "all", "failed", "sent"
    const channel = searchParams.get("channel"); // "EMAIL", "WHATSAPP", or null for all
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = (page - 1) * limit;

    // Build the query
    const query = supabase
      .from("notifications")
      .select(
        `
        id,
        title,
        message,
        template_code,
        created_at,
        user_id,
        dossier_id,
        payload,
        action_url,
        profiles!notifications_user_id_fkey(full_name, phone),
        notification_deliveries(
          id,
          channel,
          status,
          recipient,
          provider_response,
          sent_at,
          failed_at,
          created_at
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error("[GET /api/admin/notifications] Query error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des notifications" },
        { status: 500 }
      );
    }

    // Filter by status if specified
    let filteredNotifications = notifications || [];

    if (status === "failed") {
      filteredNotifications = filteredNotifications.filter((n) =>
        n.notification_deliveries?.some(
          (d: NotificationDelivery) => d.status === "FAILED"
        )
      );
    } else if (status === "sent") {
      filteredNotifications = filteredNotifications.filter((n) =>
        n.notification_deliveries?.every(
          (d: NotificationDelivery) => d.status === "SENT"
        )
      );
    }

    // Filter by channel if specified
    if (channel) {
      filteredNotifications = filteredNotifications.map((n) => ({
        ...n,
        notification_deliveries: n.notification_deliveries?.filter(
          (d: NotificationDelivery) => d.channel === channel
        ),
      }));
    }

    // Get total failed count for badge
    const { count: totalFailedCount } = await supabase
      .from("notification_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "FAILED");

    return NextResponse.json({
      notifications: filteredNotifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      failedCount: totalFailedCount || 0,
    });
  } catch (error) {
    console.error("[GET /api/admin/notifications] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
