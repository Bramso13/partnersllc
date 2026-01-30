import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth";
import { getPaymentsByOrderId, addOrderPayment } from "@/lib/order-payments";
import type { PaymentMethod } from "@/types/orders";

const PaymentMethodEnum = z.enum(["VIREMENT", "CHEQUE", "STRIPE", "AUTRE"]);
const BodySchema = z.object({
  amount: z.number().int().positive(),
  paid_at: z.string().datetime(),
  payment_method: PaymentMethodEnum.optional().nullable(),
});

/**
 * POST /api/admin/orders/[id]/payments
 * Ajoute un paiement manuel à une commande. Si somme des paiements >= order.amount, met à jour order.status = PAID et order.paid_at.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireAdminAuth();
    const { id: orderId } = await params;
    const body: unknown = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { amount, paid_at, payment_method } = parsed.data;
    const { payment, orderUpdated } = await addOrderPayment(
      orderId,
      amount,
      paid_at,
      (payment_method as PaymentMethod) ?? null,
      profile.id
    );
    const payments = await getPaymentsByOrderId(orderId);
    return NextResponse.json(
      { payment, payments, orderUpdated },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Order not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error("[POST /api/admin/orders/[id]/payments]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
