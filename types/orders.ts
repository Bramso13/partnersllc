export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type PaymentMethod = "VIREMENT" | "CHEQUE" | "STRIPE" | "AUTRE";

export interface OrderPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod | null;
  paid_at: string;
  created_at: string;
  created_by: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  payment_link_id: string | null;
  dossier_id: string | null;
  amount: number;
  currency: string;
  status: OrderStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithProduct extends Order {
  product: {
    id: string;
    name: string;
    description: string | null;
    code: string;
    price_amount: number;
    currency: string;
  };
}

export function isPendingOrder(order: Order): boolean {
  return order.status === "PENDING";
}

export function isFailedOrder(order: Order): boolean {
  return order.status === "FAILED";
}

export function isPaidOrder(order: Order): boolean {
  return order.status === "PAID";
}

export function needsPayment(order: Order): boolean {
  return order.status === "PENDING" || order.status === "FAILED";
}

export function formatOrderAmount(order: Order): string {
  const amount = order.amount / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: order.currency,
  }).format(amount);
}

/**
 * Montant déjà payé pour une commande : somme des order_payments, ou order.amount si PAID sans paiements.
 * @param order - La commande
 * @param paymentsSum - Somme des order_payments.amount (centimes) pour cette commande, ou undefined si pas de lignes
 */
export function getAmountPaidForOrder(
  order: Order,
  paymentsSum: number | undefined
): number {
  if (paymentsSum !== undefined && paymentsSum > 0) {
    return paymentsSum;
  }
  if (order.status === "PAID") {
    return order.amount;
  }
  return 0;
}
