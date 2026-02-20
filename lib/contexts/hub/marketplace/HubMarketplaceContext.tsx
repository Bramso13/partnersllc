"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useApi } from "@/lib/api/useApi";
import type {
  MarketplaceListing,
  ListingsResponse,
  CreateListingBody,
  UpdateListingBody,
} from "@/types/hub-marketplace";

interface ListingsFilter {
  q?: string;
  category?: string;
  page?: number;
}

interface HubMarketplaceContextValue {
  listings: MarketplaceListing[];
  myListings: MarketplaceListing[];
  total: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchListings: (filters?: ListingsFilter) => Promise<void>;
  fetchMyListings: () => Promise<void>;
  createListing: (body: CreateListingBody) => Promise<MarketplaceListing>;
  updateListing: (id: string, body: UpdateListingBody) => Promise<void>;
  archiveListing: (id: string) => Promise<void>;
  sendInquiry: (listingId: string, message: string) => Promise<void>;
}

const HubMarketplaceContext = createContext<HubMarketplaceContextValue | null>(null);

export function HubMarketplaceProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [listings, setListings]       = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings]   = useState<MarketplaceListing[]>([]);
  const [total, setTotal]             = useState(0);
  const [isLoading, setIsLoading]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fetchListings = useCallback(async (filters: ListingsFilter = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.q)        params.set("q", filters.q);
      if (filters.category) params.set("category", filters.category);
      if (filters.page)     params.set("page", String(filters.page));

      const data = await api.get<ListingsResponse>(
        `/api/hub/marketplace${params.toString() ? `?${params}` : ""}`
      );
      setListings(data.listings);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyListings = useCallback(async () => {
    try {
      const data = await api.get<{ listings: MarketplaceListing[] }>("/api/hub/marketplace/mine");
      setMyListings(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, []);

  const createListing = useCallback(async (body: CreateListingBody): Promise<MarketplaceListing> => {
    setIsSubmitting(true);
    try {
      const data = await api.post<{ listing: MarketplaceListing }>("/api/hub/marketplace", body);
      setMyListings((prev) => [data.listing, ...prev]);
      return data.listing;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateListing = useCallback(async (id: string, body: UpdateListingBody): Promise<void> => {
    setIsSubmitting(true);
    try {
      await api.patch(`/api/hub/marketplace/${id}`, body);
      setMyListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...body } : l))
      );
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...body } : l))
      );
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const archiveListing = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/api/hub/marketplace/${id}`);
    setMyListings((prev) => prev.filter((l) => l.id !== id));
    setListings((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const sendInquiry = useCallback(async (listingId: string, message: string): Promise<void> => {
    await api.post(`/api/hub/marketplace/${listingId}/inquire`, { message });
  }, []);

  const value = useMemo(
    () => ({
      listings, myListings, total,
      isLoading, isSubmitting, error,
      fetchListings, fetchMyListings,
      createListing, updateListing, archiveListing, sendInquiry,
    }),
    [listings, myListings, total, isLoading, isSubmitting, error,
     fetchListings, fetchMyListings, createListing, updateListing, archiveListing, sendInquiry]
  );

  return (
    <HubMarketplaceContext.Provider value={value}>
      {children}
    </HubMarketplaceContext.Provider>
  );
}

export function useHubMarketplace() {
  const ctx = useContext(HubMarketplaceContext);
  if (!ctx) throw new Error("useHubMarketplace must be used within HubMarketplaceProvider");
  return ctx;
}
