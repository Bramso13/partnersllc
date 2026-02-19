import * as client from "@/lib/modules/orders/client";
import * as admin from "@/lib/modules/orders/admin";

export async function getUserOrders() {
  return client.getAll();
}

export async function getPendingOrders() {
  return client.getPending();
}

export async function getPaidOrders() {
  return client.getPaid();
}

export async function getPaymentsByOrderId(orderId: string) {
  return admin.getPaymentsByOrderId(orderId);
}

export async function getPaymentsSumForOrderId(orderId: string) {
  return admin.getPaymentsSumForOrderId(orderId);
}

export async function getPaymentsSumByOrderIds(orderIds: string[]) {
  return admin.getPaymentsSumByOrderIds(orderIds);
}

export async function addOrderPayment(
  orderId: string,
  amount: number,
  paidAt: string,
  paymentMethod: Parameters<typeof admin.addPayment>[3],
  createdBy: Parameters<typeof admin.addPayment>[4]
) {
  return admin.addPayment(orderId, amount, paidAt, paymentMethod, createdBy);
}

export async function syncPaymentStatus(userId: string) {
  return admin.syncPaymentStatus(userId);
}
