import { createAdminClient } from "@/lib/supabase/server";
import { BaseEvent, EventType } from "@/lib/events";
import { NotificationRule, NotificationChannel } from "./types";
import { processEmailNotification, processWhatsAppNotification } from "./processor";

// =========================================================
// NOTIFICATION ORCHESTRATOR
// Story 3.9: Event-to-Notification Orchestration System
// =========================================================

/**
 * Main entry point: Process an event and create notifications based on matching rules
 */
export async function processEventForNotifications(
  event: BaseEvent
): Promise<{ processed: number; succeeded: number; failed: number }> {


  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Get matching rules for this event type
    const rules = await getMatchingRules(event.event_type);

    if (rules.length === 0) {
      console.log(`No active rules found for event type: ${event.event_type}`);
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    console.log(
      `Found ${rules.length} active rule(s) for event type: ${event.event_type}`
    );

    // Process each matching rule
    for (const rule of rules) {
      processed++;

      try {
        // Evaluate conditions if present
        if (rule.conditions && !evaluateRuleConditions(rule, event)) {
          console.log(`Rule ${rule.id} conditions not met, skipping`);
          // Log as skipped (not failed)
          await logRuleExecution(rule, event, null, true, "Conditions not met");
          continue;
        }

        // Determine recipients from event
        const recipients = await determineRecipients(event);

        if (recipients.length === 0) {
          console.log(`No recipients found for event ${event.id}, skipping rule ${rule.id}`);
          await logRuleExecution(rule, event, null, true, "No recipients found");
          continue;
        }

        // Create notification for each recipient
        for (const userId of recipients) {
          try {
            const notification = await createNotificationFromRule(rule, event, userId);

            if (notification) {
              // Trigger delivery for all configured channels
              await triggerNotificationDelivery(notification.id, rule.channels);

              // Log successful execution
              await logRuleExecution(rule, event, notification.id, true, null);
              succeeded++;
            } else {
              throw new Error("Failed to create notification");
            }
          } catch (error: any) {
            console.error(
              `Error creating notification for rule ${rule.id}:`,
              error
            );
            await logRuleExecution(
              rule,
              event,
              null,
              false,
              error.message || "Unknown error"
            );
            failed++;
          }
        }
      } catch (error: any) {
        console.error(`Error processing rule ${rule.id}:`, error);
        await logRuleExecution(
          rule,
          event,
          null,
          false,
          error.message || "Unknown error"
        );
        failed++;
      }
    }

    return { processed, succeeded, failed };
  } catch (error: any) {
    console.error("Error in processEventForNotifications:", error);
    return { processed, succeeded, failed };
  }
}

/**
 * Get all active rules matching the event type, ordered by priority
 */
export async function getMatchingRules(
  eventType: EventType
): Promise<NotificationRule[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notification_rules")
    .select("*")
    .eq("event_type", eventType)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching notification rules:", error);
    throw error;
  }

  return (data || []) as NotificationRule[];
}

/**
 * Evaluate rule conditions against event payload
 */
export function evaluateRuleConditions(
  rule: NotificationRule,
  event: BaseEvent
): boolean {
  if (!rule.conditions) {
    return true; // No conditions = always match
  }

  try {
    // Simple condition evaluation: check if event payload matches all conditions
    // Supports nested paths using dot notation
    return checkConditions(rule.conditions, event);
  } catch (error: any) {
    console.error("Error evaluating rule conditions:", error);
    return false; // If evaluation fails, don't execute the rule
  }
}

/**
 * Recursively check if conditions match event data
 */
function checkConditions(
  conditions: Record<string, any>,
  event: BaseEvent
): boolean {
  for (const [key, expectedValue] of Object.entries(conditions)) {
    if (key === "payload") {
      // Check nested payload conditions
      if (typeof expectedValue === "object" && expectedValue !== null) {
        for (const [payloadKey, payloadValue] of Object.entries(
          expectedValue
        )) {
          const actualValue = event.payload[payloadKey];
          if (actualValue !== payloadValue) {
            return false;
          }
        }
      }
    } else {
      // Check top-level event properties
      const actualValue = (event as any)[key];
      if (actualValue !== expectedValue) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Determine which users should receive notifications for this event
 */
export async function determineRecipients(
  event: BaseEvent
): Promise<string[]> {
  const supabase = createAdminClient();

  // Extract user_id from event payload or entity
  const recipients: string[] = [];

  // Try to get user_id from payload
  if (event.payload.user_id) {
    recipients.push(event.payload.user_id);
  }

  // If no user_id in payload, try to get it from dossier
  if (
    recipients.length === 0 &&
    event.payload.dossier_id &&
    event.entity_type === "dossier"
  ) {
    const { data: dossier } = await supabase
      .from("dossiers")
      .select("user_id")
      .eq("id", event.payload.dossier_id)
      .single();

    if (dossier?.user_id) {
      recipients.push(dossier.user_id);
    }
  }

  // If entity is a dossier, get the owner
  if (recipients.length === 0 && event.entity_type === "dossier") {
    const { data: dossier } = await supabase
      .from("dossiers")
      .select("user_id")
      .eq("id", event.entity_id)
      .single();

    if (dossier?.user_id) {
      recipients.push(dossier.user_id);
    }
  }

  // For document events, get user from dossier
  if (
    recipients.length === 0 &&
    (event.entity_type === "document" ||
      event.entity_type === "document_version")
  ) {
    // Try to get dossier_id from payload
    let dossierId = event.payload.dossier_id;

    // If not in payload, get from document
    if (!dossierId) {
      const { data: document } = await supabase
        .from("documents")
        .select("dossier_id")
        .eq("id", event.entity_id)
        .single();

      dossierId = document?.dossier_id;
    }

    if (dossierId) {
      const { data: dossier } = await supabase
        .from("dossiers")
        .select("user_id")
        .eq("id", dossierId)
        .single();

      if (dossier?.user_id) {
        recipients.push(dossier.user_id);
      }
    }
  }

  // For step_instance events, get user from dossier
  if (recipients.length === 0 && event.entity_type === "step_instance") {
    const { data: stepInstance } = await supabase
      .from("step_instances")
      .select("dossier_id")
      .eq("id", event.entity_id)
      .single();

    if (stepInstance?.dossier_id) {
      const { data: dossier } = await supabase
        .from("dossiers")
        .select("user_id")
        .eq("id", stepInstance.dossier_id)
        .single();

      if (dossier?.user_id) {
        recipients.push(dossier.user_id);
      }
    }
  }

  // Remove duplicates
  return Array.from(new Set(recipients));
}

/**
 * Create a notification from a rule and event
 */
export async function createNotificationFromRule(
  rule: NotificationRule,
  event: BaseEvent,
  userId: string
): Promise<{ id: string } | null> {
  const supabase = createAdminClient();

  // Construct action URL based on event type
  const actionUrl = constructActionUrl(event);

  // Extract dossier_id from event
  let dossierId: string | null = null;

  if (event.entity_type === "dossier") {
    dossierId = event.entity_id;
  } else if (event.payload.dossier_id) {
    dossierId = event.payload.dossier_id;
  }

  // Build notification title and message based on template
  const { title, message } = buildNotificationContent(rule.template_code, event);

  // Create notification
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      dossier_id: dossierId,
      event_id: event.id,
      title,
      message,
      template_code: rule.template_code,
      payload: event.payload,
      action_url: actionUrl,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }

  return data;
}

/**
 * Build notification title and message from template code
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

    case "SET_PASSWORD":
      return {
        title: "Votre compte a été créé",
        message: "Votre compte Partners LLC a été créé. Cliquez sur le lien reçu par email pour choisir votre mot de passe.",
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

/**
 * Construct action URL based on event type and payload
 */
export function constructActionUrl(event: BaseEvent): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Get dossier_id from various sources
  let dossierId: string | null = null;

  if (event.entity_type === "dossier") {
    dossierId = event.entity_id;
  } else if (event.payload.dossier_id) {
    dossierId = event.payload.dossier_id;
  }

  // If we have a dossier, link to it
  if (dossierId) {
    return `${baseUrl}/dashboard/dossiers/${dossierId}`;
  }

  // For payment events, link to payment page
  if (event.event_type === "PAYMENT_RECEIVED" || event.event_type === "PAYMENT_FAILED") {
    if (event.payload.order_id) {
      return `${baseUrl}/dashboard/payment/${event.payload.order_id}`;
    }
  }

  // Default: link to dashboard
  return `${baseUrl}/dashboard`;
}

/**
 * Trigger notification delivery for all configured channels.
 * Awaited via Promise.allSettled to ensure deliveries complete before the
 * serverless function exits (fire-and-forget would be killed by Vercel).
 */
async function triggerNotificationDelivery(
  notificationId: string,
  channels: NotificationChannel[]
): Promise<void> {
  const deliveryPromises: Promise<unknown>[] = [];

  for (const channel of channels) {
    switch (channel) {
      case "EMAIL":
        deliveryPromises.push(
          processEmailNotification(notificationId).catch((error) => {
            console.error(
              `Error processing EMAIL notification ${notificationId}:`,
              error
            );
          })
        );
        break;

      case "WHATSAPP":
        deliveryPromises.push(
          processWhatsAppNotification(notificationId).catch((error) => {
            console.error(
              `Error processing WHATSAPP notification ${notificationId}:`,
              error
            );
          })
        );
        break;

      case "IN_APP":
        // In-app notifications are automatically created when notification record is inserted
        break;

      case "SMS":
        console.log(`SMS channel not yet implemented for notification ${notificationId}`);
        break;

      default:
        console.warn(`Unknown channel type: ${channel}`);
    }
  }

  await Promise.allSettled(deliveryPromises);
}

/**
 * Log rule execution for monitoring and debugging
 */
export async function logRuleExecution(
  rule: NotificationRule,
  event: BaseEvent,
  notificationId: string | null,
  success: boolean,
  errorMessage: string | null
): Promise<void> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase.from("notification_rule_executions").insert({
      rule_id: rule.id,
      event_id: event.id,
      notification_id: notificationId,
      success,
      error_message: errorMessage,
      retry_count: 0,
    });

    if (error) {
      console.error("Error logging rule execution:", error);
    }
  } catch (error: any) {
    console.error("Error logging rule execution:", error);
  }
}

/**
 * Retry failed rule executions
 */
export async function retryFailedRuleExecutions(
  maxRetries: number = 3
): Promise<{ retried: number; succeeded: number; failed: number }> {
  const supabase = createAdminClient();

  let retried = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Get failed executions that haven't exceeded max retries
    const { data: failedExecutions, error } = await supabase
      .from("notification_rule_executions")
      .select("*, notification_rules(*), events(*)")
      .eq("success", false)
      .lt("retry_count", maxRetries)
      .order("executed_at", { ascending: true })
      .limit(10);

    if (error || !failedExecutions) {
      console.error("Error fetching failed executions:", error);
      return { retried: 0, succeeded: 0, failed: 0 };
    }

    for (const execution of failedExecutions) {
      retried++;

      const event = execution.events as any as BaseEvent;

      try {
        // Retry the rule execution
        const result = await processEventForNotifications(event);

        if (result.succeeded > 0) {
          // Update execution as succeeded
          await supabase
            .from("notification_rule_executions")
            .update({
              success: true,
              error_message: null,
              retry_count: execution.retry_count + 1,
            })
            .eq("id", execution.id);

          succeeded++;
        } else {
          throw new Error("Retry failed");
        }
      } catch (error: any) {
        // Update retry count
        await supabase
          .from("notification_rule_executions")
          .update({
            retry_count: execution.retry_count + 1,
            error_message: error.message || "Retry failed",
          })
          .eq("id", execution.id);

        failed++;
      }
    }

    return { retried, succeeded, failed };
  } catch (error: any) {
    console.error("Error in retryFailedRuleExecutions:", error);
    return { retried, succeeded, failed };
  }
}
