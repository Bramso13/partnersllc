// =========================================================
// STEP COMPLETED NOTIFICATIONS HELPER
// =========================================================

import { processEmailNotification, processWhatsAppNotification } from "./processor";

export interface StepNotificationResult {
  emailSent: boolean;
  emailError?: string;
  whatsappSent: boolean;
  whatsappError?: string;
}

/**
 * Send step completed notifications via Email and WhatsApp in parallel
 * This function does not throw errors - it logs them and returns results
 */
export async function sendStepCompletedNotifications(
  notificationId: string,
  dossierId: string,
  userId: string
): Promise<StepNotificationResult> {
  console.log(
    `[sendStepCompletedNotifications] Sending notifications for notification ${notificationId}, dossier ${dossierId}, user ${userId}`
  );

  // Send both notifications in parallel using Promise.allSettled
  // This ensures one failure doesn't affect the other
  const results = await Promise.allSettled([
    processEmailNotification(notificationId),
    processWhatsAppNotification(notificationId),
  ]);

  const emailResult = results[0];
  const whatsappResult = results[1];

  // Process email result
  let emailSent = false;
  let emailError: string | undefined;

  if (emailResult.status === "fulfilled") {
    emailSent = emailResult.value.success;
    emailError = emailResult.value.error;
    if (emailSent) {
      console.log(`[sendStepCompletedNotifications] Email sent successfully for notification ${notificationId}`);
    } else {
      console.warn(`[sendStepCompletedNotifications] Email failed for notification ${notificationId}: ${emailError}`);
    }
  } else {
    emailError = emailResult.reason?.message || "Email sending failed unexpectedly";
    console.error(`[sendStepCompletedNotifications] Email exception for notification ${notificationId}:`, emailResult.reason);
  }

  // Process WhatsApp result
  let whatsappSent = false;
  let whatsappError: string | undefined;

  if (whatsappResult.status === "fulfilled") {
    whatsappSent = whatsappResult.value.success;
    whatsappError = whatsappResult.value.error;
    if (whatsappSent) {
      console.log(`[sendStepCompletedNotifications] WhatsApp sent successfully for notification ${notificationId}`);
    } else {
      console.warn(`[sendStepCompletedNotifications] WhatsApp failed for notification ${notificationId}: ${whatsappError}`);
    }
  } else {
    whatsappError = whatsappResult.reason?.message || "WhatsApp sending failed unexpectedly";
    console.error(`[sendStepCompletedNotifications] WhatsApp exception for notification ${notificationId}:`, whatsappResult.reason);
  }

  // Log summary
  console.log(
    `[sendStepCompletedNotifications] Summary for notification ${notificationId}: Email=${emailSent ? "SENT" : "FAILED"}, WhatsApp=${whatsappSent ? "SENT" : "FAILED"}`
  );

  return {
    emailSent,
    emailError,
    whatsappSent,
    whatsappError,
  };
}
