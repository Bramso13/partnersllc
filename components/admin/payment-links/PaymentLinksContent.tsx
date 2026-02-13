"use client";

import { useEffect, useState } from "react";
import type { PaymentLinkFilters } from "@/types/payment-links";
import { usePaymentLinks } from "@/lib/contexts/payment-links/PaymentLinksContext";
import { AnalyticsCards } from "./AnalyticsCards";
import { PaymentLinksFilters } from "./PaymentLinksFilters";
import { PaymentLinksTable } from "./PaymentLinksTable";
import { ConversionFunnel } from "./ConversionFunnel";
import { GeneratePaymentLinkModal } from "./GeneratePaymentLinkModal";
import { toast } from "sonner";

export function PaymentLinksContent() {
  const {
    paymentLinks,
    products,
    analytics,
    funnelData,
    isLoading: loading,
    error,
    fetchProducts,
    fetchPaymentLinks,
    fetchAnalytics,
    fetchFunnelData,
    createPaymentLink,
    bulkExpire,
    exportCsv,
  } = usePaymentLinks();
  const [filters, setFilters] = useState<PaymentLinkFilters>({});
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchPaymentLinks(filters);
    fetchAnalytics(filters);
    fetchFunnelData(filters);
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
      const data = await bulkExpire(selectedLinks);
      toast.success(data.message ?? "Liens expirés");
      setSelectedLinks([]);
      fetchPaymentLinks(filters);
      fetchAnalytics(filters);
    } catch {
      toast.error("Échec de l'expiration");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-links-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export téléchargé");
    } catch {
      toast.error("Erreur lors de l'export");
    }
  };

  const refetch = () => {
    fetchPaymentLinks(filters);
    fetchAnalytics(filters);
    fetchFunnelData(filters);
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
          onClick={() => refetch()}
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
            refetch();
          }}
          products={products}
        />
      )}
    </div>
  );
}
