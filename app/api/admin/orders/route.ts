import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentsSumByOrderIds } from "@/lib/order-payments";
import { getAmountPaidForOrder } from "@/types/orders";

export type AdminOrderRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  dossier_id: string | null;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  client: { id: string; full_name: string | null } | null;
  product: { id: string; name: string; price_amount: number } | null;
  amount_paid: number;
};

/**
 * GET /api/admin/orders
 * Liste toutes les commandes avec client, produit, montant déjà payé (somme order_payments ou order.amount si PAID sans paiements).
 * Query: status?, product_id?, user_id?
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const product_id = searchParams.get("product_id");
    const user_id = searchParams.get("user_id");

    let query = supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        product_id,
        dossier_id,
        amount,
        currency,
        status,
        paid_at,
        created_at,
        updated_at,
        metadata,
        profiles!orders_user_id_fkey(id, full_name),
        products(id, name, price_amount)
      `
      )
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (product_id) query = query.eq("product_id", product_id);
    if (user_id) query = query.eq("user_id", user_id);

    const { data: orders, error } = await query;

    if (error) {
      console.error("[GET /api/admin/orders]", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    const list = orders ?? [];
    const orderIds = list.map((o) => o.id);
    const paymentsSumMap = await getPaymentsSumByOrderIds(orderIds);

    const result: AdminOrderRow[] = list.map((o) => {
      const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
      const product = Array.isArray(o.products) ? o.products[0] : o.products;
      const paymentsSum = paymentsSumMap.get(o.id);
      const amountPaid = getAmountPaidForOrder(
        {
          id: o.id,
          user_id: o.user_id,
          product_id: o.product_id ?? "",
          payment_link_id: null,
          dossier_id: o.dossier_id,
          amount: o.amount,
          currency: o.currency,
          status: o.status,
          stripe_checkout_session_id: null,
          stripe_payment_intent_id: null,
          stripe_customer_id: null,
          paid_at: o.paid_at,
          metadata: o.metadata,
          created_at: o.created_at,
          updated_at: (o as { updated_at?: string }).updated_at ?? o.created_at,
        },
        paymentsSum
      );
      return {
        id: o.id,
        user_id: o.user_id,
        product_id: o.product_id ?? null,
        dossier_id: o.dossier_id ?? null,
        amount: o.amount,
        currency: o.currency,
        status: o.status,
        paid_at: o.paid_at ?? null,
        created_at: o.created_at,
        metadata: o.metadata ?? null,
        client: profile
          ? { id: profile.id, full_name: profile.full_name ?? null }
          : null,
        product: product
          ? {
              id: product.id,
              name: product.name,
              price_amount: product.price_amount,
            }
          : null,
        amount_paid: amountPaid,
      };
    });

    return NextResponse.json({ orders: result });
  } catch (error) {
    console.error("[GET /api/admin/orders]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
