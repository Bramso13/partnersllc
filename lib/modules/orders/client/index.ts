import { createClient } from "@/lib/supabase/server";
import type { OrderWithProduct } from "@/types/orders";

export async function getAll(): Promise<OrderWithProduct[]> {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      product:products(
        id,
        name,
        description,
        code,
        price_amount,
        currency
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }

  return (orders || []).map((order) => {
    const product = Array.isArray(order.product)
      ? order.product[0]
      : order.product;

    return {
      ...order,
      product: product || {
        id: order.product_id,
        name: "Produit inconnu",
        description: null,
        code: "UNKNOWN",
        price_amount: order.amount,
        currency: order.currency,
      },
    } as OrderWithProduct;
  });
}

export async function getPending(): Promise<OrderWithProduct[]> {
  const orders = await getAll();
  return orders.filter((order) => order.status === "PENDING" || order.status === "FAILED");
}

export async function getPaid(): Promise<OrderWithProduct[]> {
  const orders = await getAll();
  return orders.filter((order) => order.status === "PAID");
}
