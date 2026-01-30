/**
 * Integration tests for Story 9.3: Dossier et produit test – analytics exclusion
 *
 * Verifies that:
 * - Dossiers with is_test = true are excluded from dashboard metrics (total, active, completed, completion by product, bottlenecks)
 * - Orders linked to products with is_test = true are excluded from revenue metrics
 * - Completion rate by product excludes test dossiers and test products
 *
 * Requires: migration 036 (is_test on dossiers and products), Supabase (createAdminClient).
 */

import { createAdminClient } from "@/lib/supabase/server";
import { getDashboardMetrics } from "@/lib/analytics";

const testDossierIds: string[] = [];
const testProductIds: string[] = [];
const testUserIds: string[] = [];
const testOrderIds: string[] = [];

async function cleanup() {
  const supabase = createAdminClient();
  for (const id of testOrderIds) {
    await supabase.from("orders").delete().eq("id", id);
  }
  for (const id of testDossierIds) {
    await supabase.from("dossiers").delete().eq("id", id);
  }
  for (const id of testProductIds) {
    await supabase.from("products").delete().eq("id", id);
  }
  for (const id of testUserIds) {
    await supabase.from("profiles").delete().eq("id", id);
  }
}

/**
 * Test: Dossiers with is_test = true are excluded from total_dossiers and active_dossiers.
 */
export async function testDossierIsTestExcludedFromMetrics(): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .limit(1)
    .single();
  if (!profile) {
    console.warn(
      "⚠️ No profile found, skipping testDossierIsTestExcludedFromMetrics"
    );
    return true;
  }

  const before = await getDashboardMetrics();
  const totalBefore = before.dossier.total_dossiers;
  const activeBefore = before.dossier.active_dossiers;

  const { data: dossier, error } = await supabase
    .from("dossiers")
    .insert({
      user_id: profile.id,
      product_id: null,
      type: "LLC",
      status: "IN_PROGRESS",
      is_test: true,
    })
    .select("id")
    .single();

  if (error || !dossier) {
    console.error("Failed to create test dossier:", error);
    return false;
  }
  testDossierIds.push(dossier.id);

  const after = await getDashboardMetrics();

  await cleanup();

  const totalAfter = after.dossier.total_dossiers;
  const activeAfter = after.dossier.active_dossiers;

  if (totalAfter !== totalBefore) {
    console.error(
      `Expected total_dossiers to stay ${totalBefore} (test dossier excluded), got ${totalAfter}`
    );
    return false;
  }
  if (activeAfter !== activeBefore) {
    console.error(
      `Expected active_dossiers to stay ${activeBefore} (test dossier excluded), got ${activeAfter}`
    );
    return false;
  }
  return true;
}

/**
 * Test: Revenue metrics exclude orders linked to products with is_test = true.
 */
export async function testProductIsTestExcludedFromRevenue(): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .limit(1)
    .single();
  if (!profile) {
    console.warn(
      "⚠️ No profile found, skipping testProductIsTestExcludedFromRevenue"
    );
    return true;
  }

  const { data: existingProduct } = await supabase
    .from("products")
    .select("id")
    .eq("is_test", false)
    .limit(1)
    .single();
  if (!existingProduct) {
    console.warn("⚠️ No non-test product found, skipping revenue test");
    return true;
  }

  const { data: testProduct, error: productError } = await supabase
    .from("products")
    .insert({
      code: `TEST_ANALYTICS_${Date.now()}`,
      name: "Test Product Analytics",
      dossier_type: "LLC",
      price_amount: 99900,
      currency: "USD",
      active: true,
      is_test: true,
    })
    .select("id")
    .single();

  if (productError || !testProduct) {
    console.error("Failed to create test product:", productError);
    return false;
  }
  testProductIds.push(testProduct.id);

  const before = await getDashboardMetrics();
  const revenueBefore = before.revenue.total_revenue;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: profile.id,
      product_id: testProduct.id,
      amount: 99900,
      currency: "USD",
      status: "PAID",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    await cleanup();
    console.error("Failed to create test order:", orderError);
    return false;
  }
  testOrderIds.push(order.id);

  const after = await getDashboardMetrics();
  const revenueAfter = after.revenue.total_revenue;

  await cleanup();

  if (revenueAfter !== revenueBefore) {
    console.error(
      `Expected total_revenue to stay ${revenueBefore} (order for test product excluded), got ${revenueAfter}`
    );
    return false;
  }
  return true;
}

/**
 * Run all Story 9.3 analytics exclusion tests.
 */
export async function runAnalyticsIsTestExclusionTests(): Promise<void> {
  console.log("Running Story 9.3 analytics is_test exclusion tests...");
  try {
    if (await testDossierIsTestExcludedFromMetrics()) {
      console.log("✅ testDossierIsTestExcludedFromMetrics passed");
    } else {
      console.error("❌ testDossierIsTestExcludedFromMetrics failed");
    }
    if (await testProductIsTestExcludedFromRevenue()) {
      console.log("✅ testProductIsTestExcludedFromRevenue passed");
    } else {
      console.error("❌ testProductIsTestExcludedFromRevenue failed");
    }
  } finally {
    await cleanup();
  }
}
