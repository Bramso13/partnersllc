import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth";
import { createBalanceOrder } from "@/lib/admin/mark-balance-paid";

const BodySchema = z.object({
  deposit_order_id: z.string().uuid(),
});

/**
 * POST /api/admin/acomptes/mark-balance-paid
 * Crée une commande "solde" pour un acompte : product_id = full_product_id, amount = solde, status = PAID, metadata.deposit_order_id.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const body: unknown = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const result = await createBalanceOrder(parsed.data.deposit_order_id);
    if (!result.ok) {
      const status =
        result.error === "Deposit order not found or not paid" ||
        result.error === "Full product not found"
          ? 404
          : result.error === "Order is not a deposit or has no full product" ||
              result.error === "Balance amount must be positive"
            ? 400
            : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ order: result.order }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/acomptes/mark-balance-paid]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
