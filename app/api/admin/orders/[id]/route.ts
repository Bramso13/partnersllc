import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getPaymentsByOrderId,
  getPaymentsSumForOrderId,
} from "@/lib/order-payments";
import { getAmountPaidForOrder } from "@/types/orders";
import type { OrderPayment } from "@/types/orders";

export type AdminOrderDetail = {
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
  payments: OrderPayment[];
  amount_paid: number;
};

/**
 * GET /api/admin/orders/[id]
 * Détail d'une commande avec liste des order_payments (tri par paid_at) et montant déjà payé.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
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
        metadata,
        profiles!orders_user_id_fkey(id, full_name),
        products(id, name, price_amount)
      `
      )
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const [payments, paymentsSum] = await Promise.all([
      getPaymentsByOrderId(id),
      getPaymentsSumForOrderId(id),
    ]);

    const profile = Array.isArray(order.profiles)
      ? order.profiles[0]
      : order.profiles;
    const product = Array.isArray(order.products)
      ? order.products[0]
      : order.products;
    const amountPaid = getAmountPaidForOrder(
      {
        id: order.id,
        user_id: order.user_id,
        product_id: order.product_id ?? "",
        payment_link_id: null,
        dossier_id: order.dossier_id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        stripe_customer_id: null,
        paid_at: order.paid_at,
        metadata: order.metadata,
        created_at: order.created_at,
        updated_at:
          (order as { updated_at?: string }).updated_at ?? order.created_at,
      },
      paymentsSum
    );

    const result: AdminOrderDetail = {
      id: order.id,
      user_id: order.user_id,
      product_id: order.product_id ?? null,
      dossier_id: order.dossier_id ?? null,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      paid_at: order.paid_at ?? null,
      created_at: order.created_at,
      metadata: order.metadata ?? null,
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
      payments,
      amount_paid: amountPaid,
    };

    return NextResponse.json({ order: result });
  } catch (error) {
    console.error("[GET /api/admin/orders/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
