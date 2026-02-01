"use client";

import { useState } from "react";
import { PaymentLinkFilters, PaymentLinkStatus } from "@/types/payment-links";
import { Product } from "@/types/products";

interface PaymentLinksFiltersProps {
  filters: PaymentLinkFilters;
  onFilterChange: (filters: PaymentLinkFilters) => void;
  products: Product[];
}

const STATUS_OPTIONS: { value: PaymentLinkStatus; label: string }[] = [
  { value: "ACTIVE", label: "Actif" },
  { value: "USED", label: "Utilisé" },
  { value: "EXPIRED", label: "Expiré" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-sm placeholder-[#b7b7b7]/60 focus:outline-none focus:ring-2 focus:ring-[#50b989] focus:border-transparent";

export function PaymentLinksFilters({
  filters,
  onFilterChange,
  products,
}: PaymentLinksFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PaymentLinkFilters>(filters);

  const handleStatusToggle = (status: PaymentLinkStatus) => {
    const current = localFilters.status || [];
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    const nextFilters = { ...localFilters, status: next };
    setLocalFilters(nextFilters);
    onFilterChange(nextFilters);
  };

  const handleProductToggle = (productId: string) => {
    const current = localFilters.product_id || [];
    const next = current.includes(productId)
      ? current.filter((p) => p !== productId)
      : [...current, productId];
    const nextFilters = { ...localFilters, product_id: next };
    setLocalFilters(nextFilters);
    onFilterChange(nextFilters);
  };

  const handleSearchChange = (search: string) => {
    const nextFilters = { ...localFilters, search: search || undefined };
    setLocalFilters(nextFilters);
    onFilterChange(nextFilters);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    const nextFilters = {
      ...localFilters,
      date_range: start && end ? { start, end } : undefined,
    };
    setLocalFilters(nextFilters);
    onFilterChange(nextFilters);
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  const hasActiveFilters =
    (localFilters.status && localFilters.status.length > 0) ||
    (localFilters.product_id && localFilters.product_id.length > 0) ||
    !!localFilters.search ||
    !!localFilters.date_range;

  return (
    <div className="rounded-xl bg-[#252628] border border-[#363636] p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
          Recherche par email
        </label>
        <input
          type="text"
          placeholder="Email du prospect…"
          value={localFilters.search ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
          Statut
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = localFilters.status?.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusToggle(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[#50b989] text-[#191a1d]"
                    : "bg-[#1e1f22] border border-[#363636] text-[#b7b7b7] hover:text-[#f9f9f9] hover:border-[#363636]/80"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {products.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
            Produit
          </label>
          <div className="flex flex-wrap gap-2">
            {products.map((product) => {
              const isSelected = localFilters.product_id?.includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductToggle(product.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors truncate max-w-[180px] ${
                    isSelected
                      ? "bg-[#50b989] text-[#191a1d]"
                      : "bg-[#1e1f22] border border-[#363636] text-[#b7b7b7] hover:text-[#f9f9f9]"
                  }`}
                >
                  {product.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
          Période (date de création)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={localFilters.date_range?.start ?? ""}
            onChange={(e) =>
              handleDateRangeChange(
                e.target.value,
                localFilters.date_range?.end ?? ""
              )
            }
            className={inputClass}
          />
          <input
            type="date"
            value={localFilters.date_range?.end ?? ""}
            onChange={(e) =>
              handleDateRangeChange(
                localFilters.date_range?.start ?? "",
                e.target.value
              )
            }
            className={inputClass}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-[#b7b7b7] hover:text-[#f9f9f9] transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
