import * as orders from "@/lib/modules/orders";

export const getPaymentsByOrderId = orders.admin.getPaymentsByOrderId;
export const getPaymentsSumForOrderId = orders.admin.getPaymentsSumForOrderId;
export const getPaymentsSumByOrderIds = orders.admin.getPaymentsSumByOrderIds;
export const addOrderPayment = orders.admin.addPayment;
