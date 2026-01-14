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
  { value: "ACTIVE", label: "Active" },
  { value: "USED", label: "Used" },
  { value: "EXPIRED", label: "Expired" },
];

export function PaymentLinksFilters({
  filters,
  onFilterChange,
  products,
}: PaymentLinksFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PaymentLinkFilters>(filters);

  const handleStatusToggle = (status: PaymentLinkStatus) => {
    const currentStatuses = localFilters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    const newFilters = { ...localFilters, status: newStatuses };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleProductToggle = (productId: string) => {
    const currentProducts = localFilters.product_id || [];
    const newProducts = currentProducts.includes(productId)
      ? currentProducts.filter((p) => p !== productId)
      : [...currentProducts, productId];

    const newFilters = { ...localFilters, product_id: newProducts };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (search: string) => {
    const newFilters = { ...localFilters, search };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    const newFilters = {
      ...localFilters,
      date_range: start && end ? { start, end } : undefined,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  const hasActiveFilters =
    (localFilters.status && localFilters.status.length > 0) ||
    (localFilters.product_id && localFilters.product_id.length > 0) ||
    localFilters.search ||
    localFilters.date_range;

  return (
    <div className="bg-brand-card-bg border border-brand-border rounded-lg p-4 space-y-4">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">
          Search by Email
        </label>
        <input
          type="text"
          placeholder="Enter prospect email..."
          value={localFilters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isSelected = localFilters.status?.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => handleStatusToggle(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-brand-accent text-white"
                    : "bg-brand-dark-bg text-brand-text-secondary border border-brand-border hover:bg-brand-text-secondary/10"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Filter */}
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">
          Product
        </label>
        <div className="flex flex-wrap gap-2">
          {products.map((product) => {
            const isSelected = localFilters.product_id?.includes(product.id);
            return (
              <button
                key={product.id}
                onClick={() => handleProductToggle(product.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-brand-accent text-white"
                    : "bg-brand-dark-bg text-brand-text-secondary border border-brand-border hover:bg-brand-text-secondary/10"
                }`}
              >
                {product.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">
          Date Range (Created Date)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={localFilters.date_range?.start || ""}
            onChange={(e) =>
              handleDateRangeChange(
                e.target.value,
                localFilters.date_range?.end || ""
              )
            }
            className="px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <input
            type="date"
            value={localFilters.date_range?.end || ""}
            onChange={(e) =>
              handleDateRangeChange(
                localFilters.date_range?.start || "",
                e.target.value
              )
            }
            className="px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
