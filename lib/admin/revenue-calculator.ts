import { createAdminClient } from "@/lib/supabase/server";

/**
 * Calcule le revenu encaissé (somme de tous les paiements réussis)
 * Exclut les commandes liées à des produits test (is_test = true)
 * @returns Montant en centimes
 */
export async function calculateRevenueEncaisse(): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("amount, products(is_test)")
    .eq("status", "PAID");

  if (error) {
    console.error("Error calculating revenue encaisse:", error);
    return 0;
  }

  // Exclure les commandes avec produit test (products est un tableau côté Supabase)
  const filtered = (data || []).filter(
    (order: { amount: number; products?: { is_test?: boolean }[] | null }) =>
      !order.products?.[0]?.is_test
  );

  return filtered.reduce(
    (sum: number, order: { amount: number }) => sum + order.amount,
    0
  );
}

/**
 * Calcule le revenu signé (somme de tous les deals signés, peu importe le statut de paiement)
 * Exclut les commandes liées à des produits test (is_test = true)
 * @returns Montant en centimes
 */
export async function calculateRevenueSigne(): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("amount, products(is_test)");

  if (error) {
    console.error("Error calculating revenue signe:", error);
    return 0;
  }

  // Exclure les commandes avec produit test (products est un tableau côté Supabase)
  const filtered = (data || []).filter(
    (order: { amount: number; products?: { is_test?: boolean }[] | null }) =>
      !order.products?.[0]?.is_test
  );

  return filtered.reduce(
    (sum: number, order: { amount: number }) => sum + order.amount,
    0
  );
}

/**
 * Calcule le revenu restant à encaisser
 * Pour chaque order avec un produit acompte payé :
 * - Calculer la différence : full_product.price - acompte_product.price
 * - Somme de toutes ces différences
 * Exclut les commandes liées à des produits test (is_test = true)
 * @returns Montant en centimes
 */
export async function calculateRevenueRestant(): Promise<number> {
  const supabase = createAdminClient();

  // Récupérer tous les orders avec produits acomptes payés (exclure produits test)
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      id,
      product_id,
      products!inner (
        id,
        is_deposit,
        is_test,
        full_product_id,
        price_amount
      )
    `
    )
    .eq("status", "PAID")
    .eq("products.is_deposit", true)
    .eq("products.is_test", false);

  if (ordersError) {
    console.error("Error calculating revenue restant:", ordersError);
    return 0;
  }

  if (!orders || orders.length === 0) {
    return 0;
  }

  let totalRestant = 0;

  // IDs des commandes acompte pour lesquelles une commande "solde" existe déjà
  const { data: balanceOrders } = await supabase
    .from("orders")
    .select("id, metadata")
    .eq("status", "PAID");

  const depositOrderIdsWithBalance = new Set<string>();
  for (const row of balanceOrders ?? []) {
    const depositId =
      row.metadata &&
      typeof row.metadata === "object" &&
      "deposit_order_id" in row.metadata
        ? (row.metadata as { deposit_order_id?: string }).deposit_order_id
        : undefined;
    if (typeof depositId === "string")
      depositOrderIdsWithBalance.add(depositId);
  }

  // Pour chaque order avec produit acompte, récupérer le produit complet
  for (const order of orders) {
    if (depositOrderIdsWithBalance.has(order.id)) continue;

    const product = Array.isArray(order.products)
      ? order.products[0]
      : order.products;

    if (!product || !product.is_deposit || !product.full_product_id) {
      continue;
    }

    // Récupérer le produit complet (vérifier aussi is_test du produit complet)
    const { data: fullProduct, error: productError } = await supabase
      .from("products")
      .select("price_amount, is_test")
      .eq("id", product.full_product_id)
      .single();

    if (productError || !fullProduct) {
      console.error(
        `Error fetching full product ${product.full_product_id}:`,
        productError
      );
      continue;
    }

    // Exclure si le produit complet est aussi un produit test
    if (fullProduct.is_test) {
      continue;
    }

    const difference = fullProduct.price_amount - product.price_amount;
    totalRestant += difference;
  }

  return totalRestant;
}
