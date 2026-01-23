import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NotificationRule } from "@/lib/notifications/types";
import { BaseEvent } from "@/lib/events";
import {
  evaluateRuleConditions,
  constructActionUrl,
} from "@/lib/notifications/orchestrator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/notification-rules/[id]/test
 *
 * Test a notification rule with a sample event (dry run)
 * Does NOT create actual notifications or send messages
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const supabase = createAdminClient();

    const body = await request.json();
    const { event } = body as { event: BaseEvent };

    if (!event) {
      return NextResponse.json(
        { error: "Missing event in request body" },
        { status: 400 }
      );
    }

    // Get rule
    const { data: rule, error: ruleError } = await supabase
      .from("notification_rules")
      .select("*")
      .eq("id", id)
      .single();

    if (ruleError) {
      if (ruleError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Notification rule not found" },
          { status: 404 }
        );
      }

      console.error("Error fetching notification rule:", ruleError);
      return NextResponse.json(
        { error: "Failed to fetch notification rule", details: ruleError.message },
        { status: 500 }
      );
    }

    const notificationRule = rule as NotificationRule;

    // Check if event type matches
    if (notificationRule.event_type !== event.event_type) {
      return NextResponse.json({
        matched: false,
        reason: `Event type mismatch: rule expects ${notificationRule.event_type}, got ${event.event_type}`,
      });
    }

    // Check if rule is active
    if (!notificationRule.is_active) {
      return NextResponse.json({
        matched: false,
        reason: "Rule is not active",
      });
    }

    // Evaluate conditions
    const conditionsMet = evaluateRuleConditions(notificationRule, event);

    if (!conditionsMet) {
      return NextResponse.json({
        matched: false,
        reason: "Rule conditions not met",
        conditions: notificationRule.conditions,
      });
    }

    // Build notification preview
    const actionUrl = constructActionUrl(event);
    const { title, message } = buildNotificationContent(
      notificationRule.template_code,
      event
    );

    // Build channel previews
    const channelPreviews: Record<string, any> = {};

    if (notificationRule.channels.includes("EMAIL")) {
      channelPreviews.email = {
        subject: title,
        preview: `${title}\n\n${message}`,
        note: "Full email content generated from template_code: " + notificationRule.template_code,
      };
    }

    if (notificationRule.channels.includes("WHATSAPP")) {
      channelPreviews.whatsapp = {
        message: `${title}\n\n${message}`,
        note: "WhatsApp message formatting applied by processor",
      };
    }

    if (notificationRule.channels.includes("IN_APP")) {
      channelPreviews.in_app = {
        title,
        message,
        action_url: actionUrl,
      };
    }

    if (notificationRule.channels.includes("SMS")) {
      channelPreviews.sms = {
        message: `${title}: ${message}`,
        note: "SMS not yet implemented",
      };
    }

    return NextResponse.json({
      matched: true,
      notification_preview: {
        template_code: notificationRule.template_code,
        title,
        message,
        action_url: actionUrl,
        channels: notificationRule.channels,
        channel_previews: channelPreviews,
      },
      rule: notificationRule,
      event,
    });
  } catch (error: any) {
    console.error("Error in POST /api/admin/notification-rules/[id]/test:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

/**
 * Helper function to build notification content
 * (Duplicated from orchestrator for testing purposes)
 */
function buildNotificationContent(
  templateCode: string,
  event: BaseEvent
): { title: string; message: string } {
  const payload = event.payload;

  switch (templateCode) {
    case "STEP_COMPLETED":
      return {
        title: "Étape terminée",
        message: `L'étape "${payload.step_label || payload.step_name || "étape"}" a été terminée avec succès.`,
      };

    case "DOCUMENT_APPROVED":
      return {
        title: "Document approuvé",
        message: `Votre document "${payload.document_type || "document"}" a été approuvé.`,
      };

    case "DOCUMENT_REJECTED":
      return {
        title: "Document à corriger",
        message: `Votre document "${payload.document_type || "document"}" nécessite des corrections.`,
      };

    case "DOCUMENT_UPLOADED":
      return {
        title: "Document reçu",
        message: `Votre document a bien été reçu et sera traité prochainement.`,
      };

    case "ADMIN_DOCUMENT_DELIVERED":
      return {
        title: "Nouveaux documents disponibles",
        message: `Votre conseiller vous a envoyé ${payload.document_count || 1} document(s).`,
      };

    case "PAYMENT_CONFIRMATION":
      return {
        title: "Paiement confirmé",
        message: `Votre paiement de ${payload.amount_paid || 0} ${payload.currency || "EUR"} a bien été reçu.`,
      };

    case "PAYMENT_FAILED":
      return {
        title: "Échec du paiement",
        message: `Le paiement a échoué. Veuillez réessayer.`,
      };

    case "WELCOME":
      return {
        title: "Bienvenue",
        message: `Votre dossier a été créé avec succès. Nous vous accompagnons dans votre démarche.`,
      };

    case "ADMIN_STEP_COMPLETED":
      return {
        title: "Étape administrative terminée",
        message: `Votre conseiller a terminé l'étape "${payload.step_name || "admin"}".`,
      };

    default:
      return {
        title: "Nouvelle notification",
        message: "Vous avez une nouvelle mise à jour sur votre dossier.",
      };
  }
}
