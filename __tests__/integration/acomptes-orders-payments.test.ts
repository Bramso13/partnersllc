/**
 * Integration tests for Story 9.4: Acomptes, Commandes, Paiements multiples
 *
 * Tests:
 * - Marquer solde payé : création d'une commande solde avec bon montant et metadata, revenu restant exclut ce cas
 * - Ajouter un paiement : insertion dans order_payments et passage de la commande en PAID lorsque somme >= montant
 */

import { createAdminClient } from "@/lib/supabase/server";
import { createBalanceOrder } from "@/lib/admin/mark-balance-paid";
import {
  addOrderPayment,
  getPaymentsSumForOrderId,
} from "@/lib/order-payments";
import { calculateRevenueRestant } from "@/lib/admin/revenue-calculator";

const testProfileIds: string[] = [];
const testProductIds: string[] = [];
const testOrderIds: string[] = [];

async function cleanup() {
  const supabase = createAdminClient();
  if (testOrderIds.length > 0) {
    await supabase.from("orders").delete().in("id", testOrderIds);
  }
  if (testProfileIds.length > 0) {
    await supabase.from("profiles").delete().in("id", testProfileIds);
  }
  if (testProductIds.length > 0) {
    await supabase.from("products").delete().in("id", testProductIds);
  }
}

async function createTestProfile(): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      full_name: "Test Acomptes User",
      email: `test+acomptes_${Date.now()}@partnersllc.test`,
      phone: "+33600000000",
      role: "CLIENT",
      status: "ACTIVE",
    })
    .select("id")
    .single();
  if (error || !data)
    throw new Error(`Failed to create profile: ${error?.message}`);
  testProfileIds.push(data.id);
  return data.id;
}

async function createTestProducts(): Promise<{
  fullProductId: string;
  depositProductId: string;
  fullPrice: number;
  depositPrice: number;
}> {
  const supabase = createAdminClient();
  const fullPrice = 50000;
  const depositPrice = 20000;
  const { data: fullProduct, error: fullError } = await supabase
    .from("products")
    .insert({
      code: `TEST_FULL_${Date.now()}`,
      name: "Test Full Product",
      dossier_type: "LLC",
      price_amount: fullPrice,
      currency: "EUR",
      active: true,
      is_deposit: false,
    })
    .select("id")
    .single();
  if (fullError || !fullProduct)
    throw new Error(`Failed to create full product: ${fullError?.message}`);
  testProductIds.push(fullProduct.id);

  const { data: depositProduct, error: depositError } = await supabase
    .from("products")
    .insert({
      code: `TEST_DEPOSIT_${Date.now()}`,
      name: "Test Deposit Product",
      dossier_type: "LLC",
      price_amount: depositPrice,
      currency: "EUR",
      active: true,
      is_deposit: true,
      full_product_id: fullProduct.id,
    })
    .select("id")
    .single();
  if (depositError || !depositProduct)
    throw new Error(
      `Failed to create deposit product: ${depositError?.message}`
    );
  testProductIds.push(depositProduct.id);

  return {
    fullProductId: fullProduct.id,
    depositProductId: depositProduct.id,
    fullPrice,
    depositPrice,
  };
}

async function createDepositOrder(
  userId: string,
  depositProductId: string,
  amount: number
): Promise<string> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      product_id: depositProductId,
      payment_link_id: null,
      dossier_id: null,
      amount,
      currency: "EUR",
      status: "PAID",
      paid_at: now,
      metadata: null,
    })
    .select("id")
    .single();
  if (error || !data)
    throw new Error(`Failed to create deposit order: ${error?.message}`);
  testOrderIds.push(data.id);
  return data.id;
}

async function createPendingOrder(
  userId: string,
  productId: string,
  amount: number
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      product_id: productId,
      payment_link_id: null,
      dossier_id: null,
      amount,
      currency: "EUR",
      status: "PENDING",
      paid_at: null,
      metadata: null,
    })
    .select("id")
    .single();
  if (error || !data)
    throw new Error(`Failed to create pending order: ${error?.message}`);
  testOrderIds.push(data.id);
  return data.id;
}

/**
 * Test 1: Marquer solde payé – nouvelle commande créée avec bon montant et metadata, revenu restant exclut ce cas
 */
export async function testMarkBalancePaidAndRevenueRestant(): Promise<boolean> {
  console.log("\n🧪 Test 1: Mark balance paid + revenue restant exclusion");
  try {
    const userId = await createTestProfile();
    const { fullProductId, depositProductId, fullPrice, depositPrice } =
      await createTestProducts();
    const depositOrderId = await createDepositOrder(
      userId,
      depositProductId,
      depositPrice
    );

    const restantBefore = await calculateRevenueRestant();

    const result = await createBalanceOrder(depositOrderId);
    if (!result.ok) {
      console.error("createBalanceOrder failed:", result.error);
      return false;
    }

    const newOrder = result.order;
    const newOrderId = newOrder.id as string;
    testOrderIds.push(newOrderId);

    if (newOrder.product_id !== fullProductId) {
      console.error(
        "Expected product_id = fullProductId, got",
        newOrder.product_id
      );
      return false;
    }
    const expectedBalance = fullPrice - depositPrice;
    if (newOrder.amount !== expectedBalance) {
      console.error(
        "Expected amount =",
        expectedBalance,
        "got",
        newOrder.amount
      );
      return false;
    }
    const meta = newOrder.metadata as { deposit_order_id?: string } | null;
    if (meta?.deposit_order_id !== depositOrderId) {
      console.error(
        "Expected metadata.deposit_order_id =",
        depositOrderId,
        "got",
        meta
      );
      return false;
    }
    if (newOrder.status !== "PAID") {
      console.error("Expected status = PAID, got", newOrder.status);
      return false;
    }

    const restantAfter = await calculateRevenueRestant();
    if (restantAfter >= restantBefore) {
      console.error(
        "Expected revenue restant to decrease after balance order (before:",
        restantBefore,
        "after:",
        restantAfter,
        ")"
      );
      return false;
    }

    console.log("✅ Test 1 passed");
    return true;
  } catch (e) {
    console.error("Test 1 error:", e);
    return false;
  } finally {
    await cleanup();
  }
}

/**
 * Test 2: Ajouter un paiement – insertion dans order_payments et passage en PAID lorsque somme >= montant
 */
export async function testAddPaymentAndOrderPaid(): Promise<boolean> {
  console.log("\n🧪 Test 2: Add payment and order becomes PAID");
  try {
    const userId = await createTestProfile();
    const { fullProductId } = await createTestProducts();
    const orderAmount = 10000;
    const orderId = await createPendingOrder(
      userId,
      fullProductId,
      orderAmount
    );

    const paidAt = new Date().toISOString();
    const { payment: p1, orderUpdated: u1 } = await addOrderPayment(
      orderId,
      6000,
      paidAt,
      "VIREMENT",
      userId
    );
    if (!p1 || p1.amount !== 6000) {
      console.error("First payment not as expected:", p1);
      return false;
    }
    if (u1) {
      console.error(
        "Order should not be PAID yet after 6000 (order amount 10000)"
      );
      return false;
    }

    const sumAfterFirst = await getPaymentsSumForOrderId(orderId);
    if (sumAfterFirst !== 6000) {
      console.error("Expected sum 6000, got", sumAfterFirst);
      return false;
    }

    const { payment: p2, orderUpdated: u2 } = await addOrderPayment(
      orderId,
      4000,
      paidAt,
      "CHEQUE",
      userId
    );
    if (!p2 || p2.amount !== 4000) {
      console.error("Second payment not as expected:", p2);
      return false;
    }
    if (!u2) {
      console.error("Order should be updated to PAID after 6000+4000 >= 10000");
      return false;
    }

    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();
    if (order?.status !== "PAID") {
      console.error("Expected order.status = PAID, got", order?.status);
      return false;
    }

    console.log("✅ Test 2 passed");
    return true;
  } catch (e) {
    console.error("Test 2 error:", e);
    return false;
  } finally {
    await cleanup();
  }
}

export async function runAcomptesOrdersPaymentsTests(): Promise<void> {
  console.log("Running Story 9.4 integration tests...");
  const r1 = await testMarkBalancePaidAndRevenueRestant();
  const r2 = await testAddPaymentAndOrderPaid();
  if (r1 && r2) {
    console.log("\n✅ All Story 9.4 tests passed");
  } else {
    throw new Error("Some tests failed");
  }
}
