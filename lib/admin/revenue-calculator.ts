import { createAdminClient } from "@/lib/supabase/server";

/**
 * Calcule le revenu encaissé (somme de tous les paiements réussis)
 * @returns Montant en centimes
 */
export async function calculateRevenueEncaisse(): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("amount")
    .eq("status", "PAID");

  if (error) {
    console.error("Error calculating revenue encaisse:", error);
    return 0;
  }

  return data.reduce((sum, order) => sum + order.amount, 0);
}

/**
 * Calcule le revenu signé (somme de tous les deals signés, peu importe le statut de paiement)
 * @returns Montant en centimes
 */
export async function calculateRevenueSigne(): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("amount");

  if (error) {
    console.error("Error calculating revenue signe:", error);
    return 0;
  }

  return data.reduce((sum, order) => sum + order.amount, 0);
}

/**
 * Calcule le revenu restant à encaisser
 * Pour chaque order avec un produit acompte payé :
 * - Calculer la différence : full_product.price - acompte_product.price
 * - Somme de toutes ces différences
 * @returns Montant en centimes
 */
export async function calculateRevenueRestant(): Promise<number> {
  const supabase = createAdminClient();

  // Récupérer tous les orders avec produits acomptes payés
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id,
      product_id,
      products!inner (
        id,
        is_deposit,
        full_product_id,
        price_amount
      )
    `)
    .eq("status", "PAID")
    .eq("products.is_deposit", true);

  if (ordersError) {
    console.error("Error calculating revenue restant:", ordersError);
    return 0;
  }

  if (!orders || orders.length === 0) {
    return 0;
  }

  let totalRestant = 0;

  // Pour chaque order avec produit acompte, récupérer le produit complet
  for (const order of orders) {
    const product = Array.isArray(order.products) ? order.products[0] : order.products;
    
    if (!product || !product.is_deposit || !product.full_product_id) {
      continue;
    }

    // Récupérer le produit complet
    const { data: fullProduct, error: productError } = await supabase
      .from("products")
      .select("price_amount")
      .eq("id", product.full_product_id)
      .single();

    if (productError || !fullProduct) {
      console.error(
        `Error fetching full product ${product.full_product_id}:`,
        productError
      );
      continue;
    }

    const difference = fullProduct.price_amount - product.price_amount;
    totalRestant += difference;
  }

  return totalRestant;
}
