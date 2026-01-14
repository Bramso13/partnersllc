"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ClientFilters } from "@/lib/clients";

interface ClientsFiltersProps {
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
  totalClients: number;
}

export function ClientsFilters({
  filters,
  onFiltersChange,
  totalClients,
}: ClientsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Sync URL params with filters
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.status) {
      params.set("status", filters.status);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchInput });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === "all" ? undefined : (status as any),
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    onFiltersChange({});
  };

  const hasActiveFilters = filters.search || filters.status;

  return (
    <div className="bg-[#2D3033] rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#B7B7B7]"></i>
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] placeholder-[#B7B7B7] focus:outline-none focus:border-[#50B88A] transition-colors"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-64">
          <select
            value={filters.status || "all"}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] focus:outline-none focus:border-[#50B88A] transition-colors cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="ACTIVE">Actif</option>
            <option value="SUSPENDED">Suspendu</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#B7B7B7] hover:text-[#F9F9F9] hover:border-[#50B88A] transition-colors whitespace-nowrap"
          >
            <i className="fa-solid fa-times mr-2"></i>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-[#B7B7B7]">
        {totalClients} client{totalClients > 1 ? "s" : ""} trouvé
        {totalClients > 1 ? "s" : ""}
        {hasActiveFilters && " (filtré)"}
      </div>
    </div>
  );
}
