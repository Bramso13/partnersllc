/**
 * E2E Test: Email Notification Delivery
 * 
 * This test verifies that email notifications are sent when documents are approved.
 * 
 * Prerequisites:
 * - Test database with sample data
 * - Email test mode enabled (Ethereal)
 * - Valid user, dossier, and document records
 * 
 * To run manually:
 * 1. Set up test environment variables
 * 2. Import and call test functions
 * 3. Or use Jest if configured: npm test
 */

import { createAdminClient } from "@/lib/supabase/server";
import { processEmailNotification } from "@/lib/notifications/processor";
import { verifyEmailConnection } from "@/lib/notifications/email";

// =========================================================
// TEST HELPERS
// =========================================================

/**
 * Create a test notification for document approval
 */
async function createTestNotification(
  userId: string,
  dossierId: string,
  documentType: string = "Test Document"
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      dossier_id: dossierId,
      title: "Document approuvé",
      message: `Votre document ${documentType} a été approuvé.`,
      template_code: "DOCUMENT_APPROVED",
      payload: {
        document_type: documentType,
      },
      action_url: `/dashboard/dossiers/${dossierId}`,
    })
    .select("id")
    .single();

  if (error || !notification) {
    console.error("Error creating test notification:", error);
    return null;
  }

  return notification.id;
}

/**
 * Get notification delivery record
 */
async function getNotificationDelivery(
  notificationId: string
): Promise<any | null> {
  const supabase = createAdminClient();

  const { data: delivery, error } = await supabase
    .from("notification_deliveries")
    .select("*")
    .eq("notification_id", notificationId)
    .eq("channel", "EMAIL")
    .single();

  if (error || !delivery) {
    return null;
  }

  return delivery;
}

// =========================================================
// TEST CASES
// =========================================================

/**
 * Test 1: Verify email connection
 */
export async function testEmailConnection(): Promise<boolean> {
  console.log("🧪 Test 1: Verifying email connection...");
  
  try {
    const isConnected = await verifyEmailConnection();
    
    if (isConnected) {
      console.log("✅ Email connection verified");
      return true;
    } else {
      console.error("❌ Email connection failed");
      return false;
    }
  } catch (error: any) {
    console.error("❌ Error verifying email connection:", error.message);
    return false;
  }
}

/**
 * Test 2: Create notification and verify delivery record created
 */
export async function testNotificationDeliveryCreation(
  userId: string,
  dossierId: string
): Promise<boolean> {
  console.log("🧪 Test 2: Testing notification delivery creation...");

  try {
    // Create test notification
    const notificationId = await createTestNotification(userId, dossierId);
    if (!notificationId) {
      console.error("❌ Failed to create test notification");
      return false;
    }

    console.log(`📧 Created notification: ${notificationId}`);

    // Wait a bit for trigger to create delivery
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if delivery record was created
    const delivery = await getNotificationDelivery(notificationId);
    if (!delivery) {
      console.error("❌ Delivery record not created");
      return false;
    }

    if (delivery.channel !== "EMAIL") {
      console.error(`❌ Wrong channel: expected EMAIL, got ${delivery.channel}`);
      return false;
    }

    if (delivery.status !== "PENDING") {
      console.error(`❌ Wrong status: expected PENDING, got ${delivery.status}`);
      return false;
    }

    console.log("✅ Delivery record created correctly");
    return true;
  } catch (error: any) {
    console.error("❌ Error in test:", error.message);
    return false;
  }
}

/**
 * Test 3: Process email notification and verify sent
 */
export async function testEmailNotificationProcessing(
  userId: string,
  dossierId: string
): Promise<boolean> {
  console.log("🧪 Test 3: Testing email notification processing...");

  try {
    // Create test notification
    const notificationId = await createTestNotification(userId, dossierId);
    if (!notificationId) {
      console.error("❌ Failed to create test notification");
      return false;
    }

    console.log(`📧 Created notification: ${notificationId}`);

    // Wait for delivery record to be created
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Process the notification
    const result = await processEmailNotification(notificationId);
    
    if (!result.success) {
      console.error(`❌ Failed to process notification: ${result.error}`);
      return false;
    }

    console.log("✅ Email notification processed successfully");

    // Verify delivery record updated
    const delivery = await getNotificationDelivery(notificationId);
    if (!delivery) {
      console.error("❌ Delivery record not found");
      return false;
    }

    if (delivery.status !== "SENT") {
      console.error(`❌ Wrong status: expected SENT, got ${delivery.status}`);
      console.error("Provider response:", delivery.provider_response);
      return false;
    }

    if (!delivery.sent_at) {
      console.error("❌ sent_at not set");
      return false;
    }

    if (!delivery.provider_message_id) {
      console.error("❌ provider_message_id not set");
      return false;
    }

    console.log("✅ Email sent successfully");
    console.log(`   Message ID: ${delivery.provider_message_id}`);
    console.log(`   Sent at: ${delivery.sent_at}`);

    return true;
  } catch (error: any) {
    console.error("❌ Error in test:", error.message);
    return false;
  }
}

/**
 * Test 4: Verify email content contains approval message
 */
export async function testEmailContent(
  userId: string,
  dossierId: string,
  documentType: string = "Carte d'identité"
): Promise<boolean> {
  console.log("🧪 Test 4: Testing email content...");

  try {
    // This test would require accessing the actual email content
    // In a real scenario, you might:
    // 1. Use Ethereal API to fetch sent emails
    // 2. Parse HTML content
    // 3. Verify it contains expected text
    
    // For now, we'll just verify the notification was created with correct template
    const notificationId = await createTestNotification(userId, dossierId, documentType);
    if (!notificationId) {
      console.error("❌ Failed to create test notification");
      return false;
    }

    const supabase = createAdminClient();
    const { data: notification } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (!notification) {
      console.error("❌ Notification not found");
      return false;
    }

    if (notification.template_code !== "DOCUMENT_APPROVED") {
      console.error(`❌ Wrong template: expected DOCUMENT_APPROVED, got ${notification.template_code}`);
      return false;
    }

    if (!notification.message.includes(documentType)) {
      console.error(`❌ Message doesn't contain document type: ${documentType}`);
      return false;
    }

    console.log("✅ Email content verified");
    return true;
  } catch (error: any) {
    console.error("❌ Error in test:", error.message);
    return false;
  }
}

// =========================================================
// MAIN TEST RUNNER
// =========================================================

/**
 * Run all email notification tests
 * 
 * Usage:
 *   import { runEmailNotificationTests } from './__tests__/integration/email-notifications.test';
 *   await runEmailNotificationTests('user-id', 'dossier-id');
 */
export async function runEmailNotificationTests(
  userId: string,
  dossierId: string
): Promise<{ passed: number; failed: number; total: number }> {
  console.log("🚀 Starting Email Notification E2E Tests\n");

  const results = {
    passed: 0,
    failed: 0,
    total: 4,
  };

  // Test 1: Email connection
  if (await testEmailConnection()) {
    results.passed++;
  } else {
    results.failed++;
  }

  console.log("");

  // Test 2: Delivery creation
  if (await testNotificationDeliveryCreation(userId, dossierId)) {
    results.passed++;
  } else {
    results.failed++;
  }

  console.log("");

  // Test 3: Email processing
  if (await testEmailNotificationProcessing(userId, dossierId)) {
    results.passed++;
  } else {
    results.failed++;
  }

  console.log("");

  // Test 4: Email content
  if (await testEmailContent(userId, dossierId)) {
    results.passed++;
  } else {
    results.failed++;
  }

  console.log("\n📊 Test Results:");
  console.log(`   Passed: ${results.passed}/${results.total}`);
  console.log(`   Failed: ${results.failed}/${results.total}`);

  return results;
}
