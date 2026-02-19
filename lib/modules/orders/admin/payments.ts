import { createAdminClient } from "@/lib/supabase/server";
import type { OrderPayment, PaymentMethod } from "@/types/orders";

export async function getPaymentsByOrderId(orderId: string): Promise<OrderPayment[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_payments")
    .select("*")
    .eq("order_id", orderId)
    .order("paid_at", { ascending: true });

  if (error) {
    console.error("[getPaymentsByOrderId]", error);
    throw new Error("Failed to fetch order payments");
  }
  return (data ?? []) as OrderPayment[];
}

export async function getPaymentsSumForOrderId(orderId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_payments")
    .select("amount")
    .eq("order_id", orderId);

  if (error) {
    console.error("[getPaymentsSumForOrderId]", error);
    return 0;
  }
  return (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0);
}

export async function getPaymentsSumByOrderIds(orderIds: string[]): Promise<Map<string, number>> {
  if (orderIds.length === 0) return new Map();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_payments")
    .select("order_id, amount")
    .in("order_id", orderIds);

  if (error) {
    console.error("[getPaymentsSumByOrderIds]", error);
    return new Map(orderIds.map((id) => [id, 0]));
  }
  const map = new Map<string, number>();
  for (const id of orderIds) map.set(id, 0);
  for (const row of data ?? []) {
    const id = row.order_id as string;
    map.set(id, (map.get(id) ?? 0) + (row.amount ?? 0));
  }
  return map;
}

export async function addPayment(
  orderId: string,
  amount: number,
  paidAt: string,
  paymentMethod: PaymentMethod | null,
  createdBy: string | null
): Promise<{ payment: OrderPayment; orderUpdated: boolean }> {
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, amount, status, paid_at")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Order not found");
  }

  const { data: inserted, error: insertError } = await supabase
    .from("order_payments")
    .insert({
      order_id: orderId,
      amount,
      currency: "EUR",
      payment_method: paymentMethod ?? null,
      paid_at: paidAt,
      created_by: createdBy,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[addOrderPayment]", insertError);
    throw new Error("Failed to add payment");
  }

  const newSum = await getPaymentsSumForOrderId(orderId);
  let orderUpdated = false;
  if (newSum >= order.amount) {
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "PAID",
        paid_at: order.status === "PAID" ? order.paid_at : paidAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    orderUpdated = !updateError;
  }

  return {
    payment: inserted as OrderPayment,
    orderUpdated,
  };
}
