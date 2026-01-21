import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, type EmailError } from "./email";
import {
  sendWhatsAppMessage,
  formatToE164,
  generateStepCompletedWhatsApp,
  type WhatsAppError,
} from "./whatsapp";
import {
  generateWelcomeEmail,
  generateDocumentUploadConfirmationEmail,
  generateDocumentApprovedEmail,
  generateDocumentRejectedEmail,
  generateStepCompletedEmail,
  generatePaymentReminderEmail,
  generateAdminDocumentDeliveredEmail,
  generateAdminStepCompletedEmail,
} from "./email-templates";

// =========================================================
// TYPES
// =========================================================

interface NotificationWithUser {
  id: string;
  user_id: string;
  dossier_id: string | null;
  title: string;
  message: string;
  template_code: string | null;
  payload: Record<string, any>;
  action_url: string | null;
  created_at: string;
}

interface UserEmail {
  email: string;
  full_name: string | null;
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

/**
 * Get user email address from auth.users
 */
async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: authUser, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !authUser?.user?.email) {
    console.error(`Error fetching email for user ${userId}:`, error);
    return null;
  }

  return authUser.user.email;
}

/**
 * Get user profile with email
 */
async function getUserProfile(userId: string): Promise<UserEmail | null> {
  const supabase = createAdminClient();

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error(`Error fetching profile for user ${userId}:`, profileError);
    return null;
  }

  // Get email from auth
  const email = await getUserEmail(userId);
  if (!email) {
    return null;
  }

  return {
    email,
    full_name: profile.full_name,
  };
}

/**
 * Get user phone number from profile
 */
async function getUserPhone(userId: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .single();

  if (error || !profile?.phone) {
    console.error(`Error fetching phone for user ${userId}:`, error);
    return null;
  }

  return profile.phone;
}

/**
 * Generate unsubscribe URL
 */
function generateUnsubscribeUrl(userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/api/notifications/unsubscribe?user=${userId}`;
}

/**
 * Generate dossier URL
 */
function generateDossierUrl(dossierId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/dashboard/dossiers/${dossierId}`;
}

/**
 * Generate payment URL
 */
function generatePaymentUrl(orderId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/dashboard/payment/${orderId}`;
}

// =========================================================
// TEMPLATE MAPPING
// =========================================================

/**
 * Generate email content based on template_code
 */
async function generateEmailContent(
  notification: NotificationWithUser,
  userEmail: UserEmail
): Promise<{ html: string; text: string } | null> {
  const templateCode = notification.template_code;
  const payload = notification.payload || {};
  const unsubscribeUrl = generateUnsubscribeUrl(notification.user_id);

  const userName = userEmail.full_name || userEmail.email.split("@")[0];

  switch (templateCode) {
    case "WELCOME":
      return generateWelcomeEmail({
        userName,
        dossierId: payload.dossier_id || notification.dossier_id || "",
        productName: payload.product_name || "votre produit",
        unsubscribeUrl,
      });

    case "DOCUMENT_UPLOADED":
      if (!notification.dossier_id) return null;
      return generateDocumentUploadConfirmationEmail({
        userName,
        documentType: payload.document_type || "document",
        dossierId: notification.dossier_id,
        dossierUrl: generateDossierUrl(notification.dossier_id),
        unsubscribeUrl,
      });

    case "DOCUMENT_APPROVED":
      if (!notification.dossier_id) return null;
      return generateDocumentApprovedEmail({
        userName,
        documentType: payload.document_type || "document",
        dossierId: notification.dossier_id,
        dossierUrl: generateDossierUrl(notification.dossier_id),
        unsubscribeUrl,
      });

    case "DOCUMENT_REJECTED":
      if (!notification.dossier_id) return null;
      return generateDocumentRejectedEmail({
        userName,
        documentType: payload.document_type || "document",
        rejectionReason: payload.rejection_reason || "Document non conforme",
        dossierId: notification.dossier_id,
        dossierUrl: generateDossierUrl(notification.dossier_id),
        unsubscribeUrl,
      });

    case "STEP_COMPLETED":
      if (!notification.dossier_id) return null;
      return generateStepCompletedEmail({
        userName,
        stepName: payload.step_name || "étape",
        dossierId: notification.dossier_id,
        dossierUrl: generateDossierUrl(notification.dossier_id),
        nextStepName: payload.next_step_name,
        unsubscribeUrl,
      });

    case "PAYMENT_REMINDER":
      if (!payload.order_id) return null;
      return generatePaymentReminderEmail({
        userName,
        orderId: payload.order_id,
        amount: payload.amount || 0,
        currency: payload.currency || "EUR",
        paymentUrl: generatePaymentUrl(payload.order_id),
        unsubscribeUrl,
      });

    case "ADMIN_DOCUMENT_DELIVERED":
      if (!notification.dossier_id) return null;
      return generateAdminDocumentDeliveredEmail({
        userName,
        documentCount: payload.document_count || 1,
        dossierId: notification.dossier_id,
        dossierUrl: generateDossierUrl(notification.dossier_id),
        message: payload.message,
        unsubscribeUrl,
      });

    case "ADMIN_STEP_COMPLETED":
      if (!notification.dossier_id) return null;
      return generateAdminStepCompletedEmail({
        userName,
        stepName: payload.step_name || "Étape admin",
        documentCount: payload.document_count || 1,
        dossierId: notification.dossier_id,
        dossierUrl: generateDossierUrl(notification.dossier_id),
        message: payload.message,
        unsubscribeUrl,
      });

    default:
      // Fallback: use notification title and message
      return {
        html: `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
        `,
        text: `${notification.title}\n\n${notification.message}`,
      };
  }
}

// =========================================================
// PROCESSOR
// =========================================================

/**
 * Process a single email notification
 */
export async function processEmailNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  try {
    // Fetch notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (notifError || !notification) {
      return {
        success: false,
        error: `Notification not found: ${notifError?.message || "Unknown error"}`,
      };
    }

    const notif = notification as NotificationWithUser;

    // Get user email
    const userEmail = await getUserProfile(notif.user_id);
    if (!userEmail || !userEmail.email) {
      return {
        success: false,
        error: `User email not found for user ${notif.user_id}`,
      };
    }

    // Check if delivery already exists
    const { data: existingDelivery } = await supabase
      .from("notification_deliveries")
      .select("id, status, provider_response")
      .eq("notification_id", notificationId)
      .eq("channel", "EMAIL")
      .single();

    let deliveryId: string;
    let retryCount = 0;

    if (existingDelivery) {
      // Get retry count from provider_response
      if (existingDelivery.provider_response && typeof existingDelivery.provider_response === 'object') {
        retryCount = (existingDelivery.provider_response as any).retry_count || 0;
      }

      // Update existing delivery to PENDING if it failed (for retry)
      if (existingDelivery.status === "FAILED") {
        retryCount += 1;
        const { error: updateError } = await supabase
          .from("notification_deliveries")
          .update({
            status: "PENDING",
            failed_at: null,
            provider_response: {
              ...(existingDelivery.provider_response as object || {}),
              retry_count: retryCount,
            },
          })
          .eq("id", existingDelivery.id);

        if (updateError) {
          return {
            success: false,
            error: `Failed to update delivery: ${updateError.message}`,
          };
        }
      }
      deliveryId = existingDelivery.id;
    } else {
      // Create new delivery record
      const { data: newDelivery, error: deliveryError } = await supabase
        .from("notification_deliveries")
        .insert({
          notification_id: notificationId,
          channel: "EMAIL",
          recipient: userEmail.email,
          status: "PENDING",
          provider: "nodemailer",
          provider_response: {
            retry_count: 0,
          },
        })
        .select("id")
        .single();

      if (deliveryError || !newDelivery) {
        return {
          success: false,
          error: `Failed to create delivery: ${deliveryError?.message || "Unknown error"}`,
        };
      }

      deliveryId = newDelivery.id;
    }

    // Generate email content
    const emailContent = await generateEmailContent(notif, userEmail);
    if (!emailContent) {
      return {
        success: false,
        error: "Failed to generate email content",
      };
    }

    // Send email with retry logic
    try {
      const result = await sendEmail({
        to: userEmail.email,
        subject: notif.title,
        html: emailContent.html,
        text: emailContent.text,
      });

      // Update delivery record on success
      const { data: currentDelivery } = await supabase
        .from("notification_deliveries")
        .select("provider_response")
        .eq("id", deliveryId)
        .single();

      const currentResponse = (currentDelivery?.provider_response as any) || {};
      const currentRetryCount = currentResponse.retry_count || 0;

      const { error: updateError } = await supabase
        .from("notification_deliveries")
        .update({
          status: "SENT",
          sent_at: new Date().toISOString(),
          provider_message_id: result.messageId,
          provider_response: {
            ...currentResponse,
            retry_count: currentRetryCount,
            accepted: result.accepted,
            rejected: result.rejected,
            sent_at: new Date().toISOString(),
          },
        })
        .eq("id", deliveryId);

      if (updateError) {
        console.error("Failed to update delivery record:", updateError);
        // Email was sent but DB update failed - log but don't fail
      }

      return { success: true };
    } catch (error: any) {
      const emailError = error as EmailError;

      // Update delivery record on failure
      const { data: currentDelivery } = await supabase
        .from("notification_deliveries")
        .select("provider_response")
        .eq("id", deliveryId)
        .single();

      const currentResponse = (currentDelivery?.provider_response as any) || {};
      const currentRetryCount = currentResponse.retry_count || retryCount;

      const { error: updateError } = await supabase
        .from("notification_deliveries")
        .update({
          status: "FAILED",
          failed_at: new Date().toISOString(),
          provider_response: {
            ...currentResponse,
            retry_count: currentRetryCount,
            error: emailError.message,
            code: emailError.code,
            response: emailError.response,
            last_attempt_at: new Date().toISOString(),
          },
        })
        .eq("id", deliveryId);

      if (updateError) {
        console.error("Failed to update delivery record on failure:", updateError);
      }

      return {
        success: false,
        error: emailError.message || "Failed to send email",
      };
    }
  } catch (error: any) {
    console.error("Error processing email notification:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

// =========================================================
// WHATSAPP PROCESSOR
// =========================================================

/**
 * Generate WhatsApp message content based on template_code
 */
function generateWhatsAppContent(
  notification: NotificationWithUser,
  userName: string
): string | null {
  const templateCode = notification.template_code;
  const payload = notification.payload || {};
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const dossierUrl = notification.dossier_id
    ? `${baseUrl}/dashboard/dossiers/${notification.dossier_id}`
    : baseUrl;

  switch (templateCode) {
    case "STEP_COMPLETED":
      return generateStepCompletedWhatsApp({
        stepName: payload.step_name || "étape",
        dossierId: notification.dossier_id || "",
        nextStepName: payload.next_step_name,
        dossierUrl,
      });

    case "DOCUMENT_APPROVED":
      return `✅ Document approuvé\n\nBonjour ${userName},\n\nVotre document "${payload.document_type || "document"}" a été approuvé.\n\nVoir votre dossier : ${dossierUrl}`;

    case "DOCUMENT_REJECTED":
      return `⚠️ Document à corriger\n\nBonjour ${userName},\n\nVotre document "${payload.document_type || "document"}" nécessite des corrections.\n\nRaison : ${payload.rejection_reason || "Non conforme"}\n\nVoir votre dossier : ${dossierUrl}`;

    case "ADMIN_DOCUMENT_DELIVERED":
      return `📄 Nouveaux documents\n\nBonjour ${userName},\n\nVotre conseiller vous a envoyé ${payload.document_count || 1} document(s).\n\nVoir votre dossier : ${dossierUrl}`;

    case "ADMIN_STEP_COMPLETED":
      return `✅ Étape terminée\n\nBonjour ${userName},\n\nVotre conseiller a terminé l'étape "${payload.step_name || "admin"}".\n\nVoir votre dossier : ${dossierUrl}`;

    default:
      // Fallback: use notification message
      return `${notification.title}\n\n${notification.message}`;
  }
}

/**
 * Process a single WhatsApp notification
 */
export async function processWhatsAppNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  try {
    // Fetch notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (notifError || !notification) {
      return {
        success: false,
        error: `Notification not found: ${notifError?.message || "Unknown error"}`,
      };
    }

    const notif = notification as NotificationWithUser;

    // Get user phone
    const phone = await getUserPhone(notif.user_id);
    if (!phone) {
      return {
        success: false,
        error: `User phone not found for user ${notif.user_id}`,
      };
    }

    // Validate E.164 format
    const formattedPhone = formatToE164(phone);
    if (!formattedPhone) {
      return {
        success: false,
        error: `Invalid phone number format: ${phone}`,
      };
    }

    // Get user profile for name
    const userProfile = await getUserProfile(notif.user_id);
    const userName = userProfile?.full_name || userProfile?.email?.split("@")[0] || "Client";

    // Check if delivery already exists
    const { data: existingDelivery } = await supabase
      .from("notification_deliveries")
      .select("id, status, provider_response")
      .eq("notification_id", notificationId)
      .eq("channel", "WHATSAPP")
      .single();

    let deliveryId: string;
    let retryCount = 0;

    if (existingDelivery) {
      // Get retry count from provider_response
      if (existingDelivery.provider_response && typeof existingDelivery.provider_response === "object") {
        retryCount = (existingDelivery.provider_response as any).retry_count || 0;
      }

      // Update existing delivery to PENDING if it failed (for retry)
      if (existingDelivery.status === "FAILED") {
        retryCount += 1;
        const { error: updateError } = await supabase
          .from("notification_deliveries")
          .update({
            status: "PENDING",
            failed_at: null,
            provider_response: {
              ...((existingDelivery.provider_response as object) || {}),
              retry_count: retryCount,
            },
          })
          .eq("id", existingDelivery.id);

        if (updateError) {
          return {
            success: false,
            error: `Failed to update delivery: ${updateError.message}`,
          };
        }
      }
      deliveryId = existingDelivery.id;
    } else {
      // Create new delivery record
      const { data: newDelivery, error: deliveryError } = await supabase
        .from("notification_deliveries")
        .insert({
          notification_id: notificationId,
          channel: "WHATSAPP",
          recipient: formattedPhone,
          status: "PENDING",
          provider: "whatsapp_api",
          provider_response: {
            retry_count: 0,
          },
        })
        .select("id")
        .single();

      if (deliveryError || !newDelivery) {
        return {
          success: false,
          error: `Failed to create delivery: ${deliveryError?.message || "Unknown error"}`,
        };
      }

      deliveryId = newDelivery.id;
    }

    // Generate WhatsApp content
    const messageContent = generateWhatsAppContent(notif, userName);
    if (!messageContent) {
      return {
        success: false,
        error: "Failed to generate WhatsApp message content",
      };
    }

    // Send WhatsApp message
    try {
      const result = await sendWhatsAppMessage({
        to: formattedPhone,
        message: messageContent,
      });

      // Update delivery record on success
      const { data: currentDelivery } = await supabase
        .from("notification_deliveries")
        .select("provider_response")
        .eq("id", deliveryId)
        .single();

      const currentResponse = (currentDelivery?.provider_response as any) || {};
      const currentRetryCount = currentResponse.retry_count || 0;

      const { error: updateError } = await supabase
        .from("notification_deliveries")
        .update({
          status: "SENT",
          sent_at: new Date().toISOString(),
          provider_message_id: result.messageId,
          provider_response: {
            ...currentResponse,
            retry_count: currentRetryCount,
            message_status: result.status,
            sent_at: new Date().toISOString(),
          },
        })
        .eq("id", deliveryId);

      if (updateError) {
        console.error("Failed to update WhatsApp delivery record:", updateError);
        // Message was sent but DB update failed - log but don't fail
      }

      return { success: true };
    } catch (error: any) {
      const whatsappError = error as WhatsAppError;

      // Update delivery record on failure
      const { data: currentDelivery } = await supabase
        .from("notification_deliveries")
        .select("provider_response")
        .eq("id", deliveryId)
        .single();

      const currentResponse = (currentDelivery?.provider_response as any) || {};
      const currentRetryCount = currentResponse.retry_count || retryCount;

      const { error: updateError } = await supabase
        .from("notification_deliveries")
        .update({
          status: "FAILED",
          failed_at: new Date().toISOString(),
          provider_response: {
            ...currentResponse,
            retry_count: currentRetryCount,
            error_message: whatsappError.message,
            error_code: whatsappError.code,
            error_response: whatsappError.response,
            last_attempt_at: new Date().toISOString(),
          },
        })
        .eq("id", deliveryId);

      if (updateError) {
        console.error("Failed to update WhatsApp delivery record on failure:", updateError);
      }

      return {
        success: false,
        error: whatsappError.message || "Failed to send WhatsApp message",
      };
    }
  } catch (error: any) {
    console.error("Error processing WhatsApp notification:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Process pending email notifications (batch processing)
 */
export async function processPendingEmailNotifications(
  limit: number = 10
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const supabase = createAdminClient();

  // Find pending email deliveries
  const { data: pendingDeliveries, error } = await supabase
    .from("notification_deliveries")
    .select("id, notification_id")
    .eq("channel", "EMAIL")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !pendingDeliveries) {
    console.error("Error fetching pending deliveries:", error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const delivery of pendingDeliveries) {
    const result = await processEmailNotification(delivery.notification_id);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
      console.error(
        `Failed to process notification ${delivery.notification_id}:`,
        result.error
      );
    }
  }

  return {
    processed: pendingDeliveries.length,
    succeeded,
    failed,
  };
}
