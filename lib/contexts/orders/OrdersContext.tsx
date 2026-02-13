"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useApi } from "@/lib/api/useApi";

type AdminOrderRow = {
  id: string;
  amount: number;
  amount_paid: number;
  created_at: string;
  status: string;
  client?: { full_name: string | null };
  product?: { name: string };
};

type OrdersContextValue = {
  orders: AdminOrderRow[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: (status?: string) => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const path = status
        ? `/api/admin/orders?status=${encodeURIComponent(status)}`
        : "/api/admin/orders";
      const data = await api.get<{ orders: AdminOrderRow[] }>(path);
      setOrders(data?.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ orders, isLoading, error, fetchOrders }),
    [orders, isLoading, error, fetchOrders]
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
