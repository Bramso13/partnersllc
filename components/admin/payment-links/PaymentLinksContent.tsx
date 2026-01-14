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

export function PaymentLinksContent() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkWithDetails[]>(
    []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<PaymentLinkAnalytics | null>(
    null
  );
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
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchPaymentLinks = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();

      if (filters.status && filters.status.length > 0) {
        params.append("status", filters.status.join(","));
      }
      if (filters.product_id && filters.product_id.length > 0) {
        params.append("product_id", filters.product_id.join(","));
      }
      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.date_range) {
        params.append("date_start", filters.date_range.start);
        params.append("date_end", filters.date_range.end);
      }

      const response = await fetch(`/api/admin/payment-links?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch payment links");
      }
      const data = await response.json();
      setPaymentLinks(data.payment_links);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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

      const response = await fetch(`/api/admin/payment-links/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
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
        setFunnelData(data.funnel);
      }
    } catch (err) {
      console.error("Error fetching funnel data:", err);
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
        `Are you sure you want to expire ${selectedLinks.length} payment link(s)?`
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

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setSelectedLinks([]);
        fetchPaymentLinks();
        fetchAnalytics();
      } else {
        alert("Failed to expire payment links");
      }
    } catch (err) {
      alert("Error expiring payment links");
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
        a.download = `payment-links-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to export payment links");
      }
    } catch (err) {
      alert("Error exporting payment links");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-text-secondary">
          Loading payment links...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && <AnalyticsCards analytics={analytics} />}

      {/* Conversion Funnel */}
      {funnelData && <ConversionFunnel data={funnelData} />}

      {/* Filters */}
      <PaymentLinksFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        products={products}
      />

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          {paymentLinks.length} payment link{paymentLinks.length !== 1 ? "s" : ""}{" "}
          total
          {selectedLinks.length > 0 &&
            ` (${selectedLinks.length} selected)`}
        </div>
        <div className="flex gap-3">
          {selectedLinks.length > 0 && (
            <button
              onClick={handleBulkExpire}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Expire Selected ({selectedLinks.length})
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-brand-text-secondary/20 text-brand-text-primary rounded-lg hover:bg-brand-text-secondary/30 transition-colors font-medium"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
          >
            + Generate Link
          </button>
        </div>
      </div>

      {/* Payment Links Table */}
      <PaymentLinksTable
        paymentLinks={paymentLinks}
        selectedLinks={selectedLinks}
        onSelectionChange={setSelectedLinks}
      />

      {/* Generate Link Modal */}
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
