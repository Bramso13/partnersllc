"use client";

import { useEffect, useState } from "react";
import {
  PaymentLinkWithDetails,
  PaymentLinkAnalytics,
  ConversionFunnelData,
  PaymentLinkFilters,
} from "@/types/payment-links";
import { Product } from "@/types/products";
import { AnalyticsCards } from "./AnalyticsCards";
import { PaymentLinksFilters } from "./PaymentLinksFilters";
import { PaymentLinksTable } from "./PaymentLinksTable";
import { ConversionFunnel } from "./ConversionFunnel";
import { GeneratePaymentLinkModal } from "./GeneratePaymentLinkModal";
import { toast } from "sonner";

export function PaymentLinksContent() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkWithDetails[]>(
    []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<PaymentLinkAnalytics | null>(null);
  const [funnelData, setFunnelData] = useState<ConversionFunnelData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentLinkFilters>({});
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products ?? []);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchPaymentLinks = async () => {
    try {
      setError(null);
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

      const response = await fetch(`/api/admin/payment-links?${params}`);
      if (!response.ok) throw new Error("Erreur chargement des liens");
      const data = await response.json();
      setPaymentLinks(data.payment_links ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.date_range) {
        params.append("date_start", filters.date_range.start);
        params.append("date_end", filters.date_range.end);
      }
      const response = await fetch(
        `/api/admin/payment-links/analytics?${params}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics ?? null);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchFunnelData = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.date_range) {
        params.append("date_start", filters.date_range.start);
        params.append("date_end", filters.date_range.end);
      }
      const response = await fetch(`/api/admin/payment-links/funnel?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFunnelData(data.funnel ?? null);
      }
    } catch (err) {
      console.error("Error fetching funnel:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchPaymentLinks();
    fetchAnalytics();
    fetchFunnelData();
  }, [filters]);

  const handleFilterChange = (newFilters: PaymentLinkFilters) => {
    setFilters(newFilters);
    setSelectedLinks([]);
  };

  const handleBulkExpire = async () => {
    if (selectedLinks.length === 0) return;
    if (
      !confirm(
        `Expirer ${selectedLinks.length} lien(s) de paiement ? Cette action est irréversible.`
      )
    ) {
      return;
    }
    try {
      const response = await fetch("/api/admin/payment-links/bulk-expire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_ids: selectedLinks }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast.success(data.message ?? "Liens expirés");
        setSelectedLinks([]);
        fetchPaymentLinks();
        fetchAnalytics();
      } else {
        toast.error(data.error ?? "Échec de l’expiration");
      }
    } catch (err) {
      toast.error("Erreur lors de l’expiration");
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/payment-links/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payment-links-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Export téléchargé");
      } else {
        toast.error("Échec de l’export");
      }
    } catch (err) {
      toast.error("Erreur lors de l’export");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-[#b7b7b7]">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-[#50b989]" />
          <span className="text-sm">Chargement des liens…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-6 text-center">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchPaymentLinks();
          }}
          className="text-sm text-[#50b989] hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {analytics && <AnalyticsCards analytics={analytics} />}
      {funnelData && <ConversionFunnel data={funnelData} />}

      <PaymentLinksFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        products={products}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-[#b7b7b7]">
          {paymentLinks.length} lien{paymentLinks.length !== 1 ? "s" : ""} au
          total
          {selectedLinks.length > 0 && (
            <span className="text-[#f9f9f9] font-medium ml-1">
              ({selectedLinks.length} sélectionné
              {selectedLinks.length !== 1 ? "s" : ""})
            </span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {selectedLinks.length > 0 && (
            <button
              type="button"
              onClick={handleBulkExpire}
              className="px-4 py-2.5 rounded-lg bg-red-600/90 text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Expirer la sélection ({selectedLinks.length})
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2.5 rounded-lg border border-[#363636] text-[#f9f9f9] text-sm font-medium hover:bg-[#363636]/50 transition-colors"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2.5 rounded-lg bg-[#50b989] text-[#191a1d] text-sm font-medium hover:bg-[#50b989]/90 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-plus" />
            Générer un lien
          </button>
        </div>
      </div>

      <PaymentLinksTable
        paymentLinks={paymentLinks}
        selectedLinks={selectedLinks}
        onSelectionChange={setSelectedLinks}
      />

      {showGenerateModal && (
        <GeneratePaymentLinkModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false);
            fetchPaymentLinks();
            fetchAnalytics();
            fetchFunnelData();
          }}
          products={products}
        />
      )}
    </div>
  );
}
