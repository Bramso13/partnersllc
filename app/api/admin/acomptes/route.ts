import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export type AcompteRow = {
  id: string;
  user_id: string;
  dossier_id: string | null;
  amount: number;
  currency: string;
  paid_at: string | null;
  client: { id: string; full_name: string | null; email?: string } | null;
  product_deposit: { id: string; name: string; price_amount: number } | null;
  product_full: { id: string; name: string; price_amount: number } | null;
  balance_remaining: number;
  has_balance_order: boolean;
};

/**
 * GET /api/admin/acomptes
 * Liste des commandes acompte payées (produit is_deposit = true, status = PAID).
 * Pour chaque commande : client, produit acompte, produit complet, montant payé, solde restant, indicateur si commande solde existe.
 */
export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        dossier_id,
        amount,
        currency,
        paid_at,
        metadata,
        profiles!orders_user_id_fkey(id, full_name),
        products!orders_product_id_fkey(id, name, price_amount, is_deposit, full_product_id)
      `
      )
      .eq("status", "PAID");

    if (ordersError) {
      console.error("[GET /api/admin/acomptes]", ordersError);
      return NextResponse.json(
        { error: "Failed to fetch acomptes" },
        { status: 500 }
      );
    }

    const rows = (orders ?? []).filter((o) => {
      const p = Array.isArray(o.products) ? o.products[0] : o.products;
      return p?.is_deposit === true && p?.full_product_id;
    });

    const depositOrderIds = rows.map((r) => r.id);
    const { data: balanceOrders } = await supabase
      .from("orders")
      .select("id, metadata")
      .eq("status", "PAID");

    const depositIdsWithBalance = new Set<string>();
    for (const row of balanceOrders ?? []) {
      const meta = row.metadata as { deposit_order_id?: string } | null;
      if (meta?.deposit_order_id)
        depositIdsWithBalance.add(meta.deposit_order_id);
    }

    const fullProductIds = [
      ...new Set(
        rows
          .map((r) => {
            const p = Array.isArray(r.products) ? r.products[0] : r.products;
            return p?.full_product_id;
          })
          .filter(Boolean) as string[]
      ),
    ];

    let fullProducts: Record<
      string,
      { id: string; name: string; price_amount: number }
    > = {};
    if (fullProductIds.length > 0) {
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price_amount")
        .in("id", fullProductIds);
      for (const p of prods ?? []) {
        fullProducts[p.id] = p;
      }
    }

    const result: AcompteRow[] = rows.map((o) => {
      const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
      const productDeposit = Array.isArray(o.products)
        ? o.products[0]
        : o.products;
      const fullId = productDeposit?.full_product_id;
      const fullProduct = fullId ? (fullProducts[fullId] ?? null) : null;
      const balanceRemaining =
        fullProduct && productDeposit
          ? fullProduct.price_amount - productDeposit.price_amount
          : 0;
      const hasBalanceOrder = depositIdsWithBalance.has(o.id);

      return {
        id: o.id,
        user_id: o.user_id,
        dossier_id: o.dossier_id ?? null,
        amount: o.amount,
        currency: o.currency,
        paid_at: o.paid_at ?? null,
        client: profile
          ? { id: profile.id, full_name: profile.full_name ?? null }
          : null,
        product_deposit: productDeposit
          ? {
              id: productDeposit.id,
              name: productDeposit.name,
              price_amount: productDeposit.price_amount,
            }
          : null,
        product_full: fullProduct,
        balance_remaining: balanceRemaining,
        has_balance_order: hasBalanceOrder,
      };
    });

    return NextResponse.json({ acomptes: result });
  } catch (error) {
    console.error("[GET /api/admin/acomptes]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
