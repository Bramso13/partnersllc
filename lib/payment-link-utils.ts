import { createAdminClient } from "@/lib/supabase/server";

export interface OrphanedPayment {
  id: string;
  token: string;
  prospect_email: string;
  product_name: string;
  paid_at: string;
  amount_paid: number;
  currency: string;
  days_since_payment: number;
}

/**
 * Get all orphaned payments (paid but not registered)
 */
export async function getOrphanedPayments(): Promise<OrphanedPayment[]> {
  const adminSupabase = createAdminClient();

  const { data: orphanedPayments, error } = await adminSupabase
    .from("payment_links")
    .select(`
      id,
      token,
      prospect_email,
      paid_at,
      amount_paid,
      products(name, currency)
    `)
    .eq("status", "PAID")
    .is("used_at", null)
    .not("paid_at", "is", null)
    .order("paid_at", { ascending: false });

  if (error) {
    console.error("Error fetching orphaned payments:", error);
    return [];
  }

  const now = new Date();
  return (orphanedPayments || []).map(payment => {
    const paidAt = new Date(payment.paid_at);
    const daysSincePayment = Math.floor((now.getTime() - paidAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: payment.id,
      token: payment.token,
      prospect_email: payment.prospect_email,
      product_name: (payment.products as any)?.name || "Unknown Product",
      paid_at: payment.paid_at,
      amount_paid: payment.amount_paid || 0,
      currency: (payment.products as any)?.currency || "usd",
      days_since_payment: daysSincePayment,
    };
  });
}

/**
 * Clean up old orphaned payments (older than specified days)
 */
export async function cleanupOrphanedPayments(olderThanDays: number = 90): Promise<{ cleaned: number; errors: string[] }> {
  const adminSupabase = createAdminClient();
  const result: { cleaned: number; errors: string[] } = { cleaned: 0, errors: [] };

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    // Get orphaned payments older than cutoff
    const { data: oldPayments, error: fetchError } = await adminSupabase
      .from("payment_links")
      .select("id, token, paid_at")
      .eq("status", "PAID")
      .is("used_at", null)
      .lt("paid_at", cutoffDate.toISOString());

    if (fetchError) {
      result.errors.push(`Failed to fetch old payments: ${fetchError.message}`);
      return result;
    }

    if (!oldPayments || oldPayments.length === 0) {
      return result;
    }

    // Get associated orders to clean up
    const paymentLinkIds = oldPayments.map(p => p.id);
    const { data: orders, error: ordersError } = await adminSupabase
      .from("orders")
      .select("id")
      .in("payment_link_id", paymentLinkIds);

    if (ordersError) {
      result.errors.push(`Failed to fetch associated orders: ${ordersError.message}`);
      return result;
    }

    // Delete events related to these orders and payment links first
    const orderIds = orders?.map(o => o.id) || [];
    if (orderIds.length > 0) {
      await adminSupabase
        .from("events")
        .delete()
        .in("entity_id", orderIds)
        .eq("entity_type", "order");
    }

    await adminSupabase
      .from("events")
      .delete()
      .in("entity_id", paymentLinkIds)
      .eq("entity_type", "payment_link");

    // Delete orders (this will cascade to dossiers if any exist)
    if (orders && orders.length > 0) {
      const { error: deleteOrdersError } = await adminSupabase
        .from("orders")
        .delete()
        .in("id", orderIds);

      if (deleteOrdersError) {
        result.errors.push(`Failed to delete orders: ${deleteOrdersError.message}`);
        return result; // Stop here if orders deletion fails
      }
    }

    // Delete payment links last
    const { error: deleteLinksError } = await adminSupabase
      .from("payment_links")
      .delete()
      .in("id", paymentLinkIds);

    if (deleteLinksError) {
      result.errors.push(`Failed to delete payment links: ${deleteLinksError.message}`);
    } else {
      result.cleaned = oldPayments.length;
      console.log(`Cleaned up ${result.cleaned} orphaned payments older than ${olderThanDays} days`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(`Cleanup failed: ${errorMessage}`);
    console.error("Error during orphaned payments cleanup:", error);
  }

  return result;
}

/**
 * Get payments that need reminder emails (paid but not registered, reminder intervals)
 */
export async function getPaymentsNeedingReminders(): Promise<{
  immediate: OrphanedPayment[]; // 1 day after payment
  followUp: OrphanedPayment[];  // 7 days after payment
  final: OrphanedPayment[];      // 14 days after payment
}> {
  const orphanedPayments = await getOrphanedPayments();

  return {
    immediate: orphanedPayments.filter(p => p.days_since_payment === 1),
    followUp: orphanedPayments.filter(p => p.days_since_payment === 7),
    final: orphanedPayments.filter(p => p.days_since_payment === 14),
  };
}

/**
 * Mark a payment link as reminded (for tracking reminder emails)
 * Note: This would require adding a reminded_at field to payment_links table
 */
export async function markPaymentAsReminded(paymentLinkId: string): Promise<boolean> {
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("payment_links")
    .update({
      // Add reminded_at field to table if implementing reminders
      // reminded_at: new Date().toISOString(),
      // updated_at: new Date().toISOString(), // TODO: Uncomment after migration
    })
    .eq("id", paymentLinkId);

  return !error;
}

/**
 * Get statistics about orphaned payments
 */
export async function getOrphanedPaymentStats(): Promise<{
  total: number;
  last7Days: number;
  last30Days: number;
  olderThan30Days: number;
  olderThan90Days: number;
}> {
  const orphanedPayments = await getOrphanedPayments();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  return {
    total: orphanedPayments.length,
    last7Days: orphanedPayments.filter(p => new Date(p.paid_at) >= sevenDaysAgo).length,
    last30Days: orphanedPayments.filter(p => new Date(p.paid_at) >= thirtyDaysAgo).length,
    olderThan30Days: orphanedPayments.filter(p => new Date(p.paid_at) < thirtyDaysAgo).length,
    olderThan90Days: orphanedPayments.filter(p => new Date(p.paid_at) < ninetyDaysAgo).length,
  };
}