import { createAdminClient } from "@/lib/supabase/server";

export type CreateBalanceOrderResult =
  | { ok: true; order: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Crée une commande "solde" pour un acompte payé.
 * product_id = full_product_id, amount = solde, status = PAID, metadata.deposit_order_id.
 * Utilisé par l'API POST /api/admin/acomptes/mark-balance-paid et par les tests.
 */
export async function createBalanceOrder(
  depositOrderId: string
): Promise<CreateBalanceOrderResult> {
  const supabase = createAdminClient();

  const { data: depositOrder, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      id,
      user_id,
      dossier_id,
      amount,
      currency,
      products!orders_product_id_fkey(id, name, price_amount, is_deposit, full_product_id)
    `
    )
    .eq("id", depositOrderId)
    .eq("status", "PAID")
    .single();

  if (orderError || !depositOrder) {
    return { ok: false, error: "Deposit order not found or not paid" };
  }

  const product = Array.isArray(depositOrder.products)
    ? depositOrder.products[0]
    : depositOrder.products;
  if (!product?.is_deposit || !product.full_product_id) {
    return {
      ok: false,
      error: "Order is not a deposit or has no full product",
    };
  }

  const { data: fullProduct, error: fullError } = await supabase
    .from("products")
    .select("id, price_amount")
    .eq("id", product.full_product_id)
    .single();

  if (fullError || !fullProduct) {
    return { ok: false, error: "Full product not found" };
  }

  const balanceAmount = fullProduct.price_amount - product.price_amount;
  if (balanceAmount <= 0) {
    return { ok: false, error: "Balance amount must be positive" };
  }

  const now = new Date().toISOString();
  const { data: newOrder, error: insertError } = await supabase
    .from("orders")
    .insert({
      user_id: depositOrder.user_id,
      product_id: fullProduct.id,
      payment_link_id: null,
      dossier_id: depositOrder.dossier_id ?? null,
      amount: balanceAmount,
      currency: depositOrder.currency ?? "EUR",
      status: "PAID",
      stripe_checkout_session_id: null,
      stripe_payment_intent_id: null,
      stripe_customer_id: null,
      paid_at: now,
      metadata: { deposit_order_id: depositOrderId },
    })
    .select()
    .single();

  if (insertError) {
    console.error("[createBalanceOrder]", insertError);
    return { ok: false, error: "Failed to create balance order" };
  }

  return { ok: true, order: newOrder as Record<string, unknown> };
}
