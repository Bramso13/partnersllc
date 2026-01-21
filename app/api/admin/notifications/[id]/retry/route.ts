import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { processEmailNotification, processWhatsAppNotification } from "@/lib/notifications/processor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface NotificationDelivery {
  id: string;
  channel: string;
  status: string;
}

/**
 * POST /api/admin/notifications/[id]/retry
 * Réessaie l'envoi d'une notification échouée
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAuth();
    const { id: notificationId } = await params;
    const supabase = createAdminClient();

    // Get the notification and its failed deliveries
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select(`
        id,
        notification_deliveries(
          id,
          channel,
          status
        )
      `)
      .eq("id", notificationId)
      .single();

    if (notifError || !notification) {
      return NextResponse.json(
        { error: "Notification non trouvée" },
        { status: 404 }
      );
    }

    // Filter to only failed deliveries
    const failedDeliveries = (notification.notification_deliveries?.filter(
      (d: NotificationDelivery) => d.status === "FAILED"
    ) || []) as NotificationDelivery[];

    if (failedDeliveries.length === 0) {
      return NextResponse.json(
        { error: "Aucune notification en échec à réessayer" },
        { status: 400 }
      );
    }

    // Retry each failed delivery
    const results = await Promise.allSettled(
      failedDeliveries.map(async (delivery: NotificationDelivery) => {
        if (delivery.channel === "EMAIL") {
          return processEmailNotification(notificationId);
        } else if (delivery.channel === "WHATSAPP") {
          return processWhatsAppNotification(notificationId);
        }
        return { success: false, error: "Unknown channel" };
      })
    );

    // Process results
    const retryResults = results.map((result, index) => {
      const delivery = failedDeliveries[index];
      if (result.status === "fulfilled") {
        return {
          channel: delivery.channel,
          success: result.value.success,
          error: result.value.error,
        };
      }
      return {
        channel: delivery.channel,
        success: false,
        error: result.reason?.message || "Retry failed",
      };
    });

    const allSucceeded = retryResults.every((r) => r.success);
    const anySucceeded = retryResults.some((r) => r.success);

    return NextResponse.json({
      success: anySucceeded,
      message: allSucceeded
        ? "Toutes les notifications ont été envoyées avec succès"
        : anySucceeded
          ? "Certaines notifications ont échoué"
          : "Échec de l'envoi des notifications",
      results: retryResults,
    });
  } catch (error) {
    console.error("[POST /api/admin/notifications/retry] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
