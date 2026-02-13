"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useApi } from "@/lib/api/useApi";
import type {
  PaymentLinkWithDetails,
  PaymentLinkAnalytics,
  ConversionFunnelData,
  PaymentLinkFilters,
} from "@/types/payment-links";
import type { Product } from "@/types/products";

type PaymentLinksContextValue = {
  paymentLinks: PaymentLinkWithDetails[];
  products: Product[];
  analytics: PaymentLinkAnalytics | null;
  funnelData: ConversionFunnelData | null;
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchPaymentLinks: (filters: PaymentLinkFilters) => Promise<void>;
  fetchAnalytics: (filters: PaymentLinkFilters) => Promise<void>;
  fetchFunnelData: (filters: PaymentLinkFilters) => Promise<void>;
  createPaymentLink: (data: {
    prospect_email: string;
    prospect_name: string;
    product_id: string;
    expires_in_days: number;
  }) => Promise<void>;
  bulkExpire: (linkIds: string[]) => Promise<{ message?: string }>;
  exportCsv: () => Promise<Blob>;
};

const PaymentLinksContext = createContext<PaymentLinksContextValue | null>(
  null
);

export function PaymentLinksProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const api = useApi();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkWithDetails[]>(
    []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<PaymentLinkAnalytics | null>(null);
  const [funnelData, setFunnelData] = useState<ConversionFunnelData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get<{ products: Product[] }>(
        "/api/admin/products"
      );
      setProducts(data?.products ?? []);
    } catch {
      // ignore
    }
  }, []);

  const fetchPaymentLinks = useCallback(async (filters: PaymentLinkFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status?.length)
        params.append("status", filters.status.join(","));
      if (filters.product_id?.length)
        params.append("product_id", filters.product_id.join(","));
      if (filters.search) params.append("search", filters.search);
      if (filters.date_range) {
        params.append("date_start", filters.date_range.start);
        params.append("date_end", filters.date_range.end);
      }
      const data = await api.get<{ payment_links: PaymentLinkWithDetails[] }>(
        `/api/admin/payment-links?${params}`
      );
      setPaymentLinks(data?.payment_links ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (filters: PaymentLinkFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters.date_range) {
        params.append("date_start", filters.date_range.start);
        params.append("date_end", filters.date_range.end);
      }
      const data = await api.get<{ analytics: PaymentLinkAnalytics }>(
        `/api/admin/payment-links/analytics?${params}`
      );
      setAnalytics(data?.analytics ?? null);
    } catch {
      // ignore
    }
  }, []);

  const fetchFunnelData = useCallback(async (filters: PaymentLinkFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters.date_range) {
        params.append("date_start", filters.date_range.start);
        params.append("date_end", filters.date_range.end);
      }
      const data = await api.get<{ funnel: ConversionFunnelData }>(
        `/api/admin/payment-links/funnel?${params}`
      );
      setFunnelData(data?.funnel ?? null);
    } catch {
      // ignore
    }
  }, []);

  const createPaymentLink = useCallback(
    async (data: {
      prospect_email: string;
      prospect_name: string;
      product_id: string;
      expires_in_days: number;
    }) => {
      await api.post("/api/admin/payment-links/create", data);
    },
    []
  );

  const bulkExpire = useCallback(async (linkIds: string[]) => {
    const data = await api.post<{ message?: string }>(
      "/api/admin/payment-links/bulk-expire",
      { link_ids: linkIds }
    );
    return data ?? {};
  }, []);

  const exportCsv = useCallback(async (): Promise<Blob> => {
    return api.getBlob("/api/admin/payment-links/export");
  }, []);

  const value = useMemo(
    () => ({
      paymentLinks,
      products,
      analytics,
      funnelData,
      isLoading,
      error,
      fetchProducts,
      fetchPaymentLinks,
      fetchAnalytics,
      fetchFunnelData,
      createPaymentLink,
      bulkExpire,
      exportCsv,
    }),
    [
      paymentLinks,
      products,
      analytics,
      funnelData,
      isLoading,
      error,
      fetchProducts,
      fetchPaymentLinks,
      fetchAnalytics,
      fetchFunnelData,
      createPaymentLink,
      bulkExpire,
      exportCsv,
    ]
  );

  return (
    <PaymentLinksContext.Provider value={value}>
      {children}
    </PaymentLinksContext.Provider>
  );
}

export function usePaymentLinks() {
  const ctx = useContext(PaymentLinksContext);
  if (!ctx)
    throw new Error("usePaymentLinks must be used within PaymentLinksProvider");
  return ctx;
}
