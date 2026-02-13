"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface AdminDossiersFiltersProps {
  totalDossiers: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "QUALIFICATION", label: "Qualification" },
  { value: "FORM_SUBMITTED", label: "Formulaire soumis" },
  { value: "NM_PENDING", label: "NM en attente" },
  { value: "LLC_ACCEPTED", label: "LLC accepté" },
  { value: "EIN_PENDING", label: "EIN en attente" },
  { value: "BANK_PREPARATION", label: "Préparation bancaire" },
  { value: "BANK_OPENED", label: "Banque ouverte" },
  { value: "WAITING_48H", label: "Attente 48H" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "UNDER_REVIEW", label: "En révision" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "CLOSED", label: "Fermé" },
  { value: "ERROR", label: "Erreur" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents" },
  { value: "oldest", label: "Plus anciens" },
  { value: "progress_asc", label: "Progression croissante" },
  { value: "progress_desc", label: "Progression décroissante" },
  { value: "status_az", label: "Statut A-Z" },
];

export function AdminDossiersFilters({
  totalDossiers,
}: AdminDossiersFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateQueryParam("search", searchInput);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams();

    // Preserve existing params
    searchParams.forEach((val, k) => {
      if (k !== key) params.set(k, val);
    });

    // Set new value or delete if empty
    if (value && value !== "all") {
      params.set(key, value);
    }

    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(newUrl, { scroll: false });
  };

  const handleStatusChange = (status: string) => {
    updateQueryParam("status", status);
  };

  const handleSortChange = (sort: string) => {
    updateQueryParam("sort", sort);
  };

  const handleClearSearch = () => {
    setSearchInput("");
  };

  const hasFilters =
    searchInput ||
    (searchParams.get("status") && searchParams.get("status") !== "all");

  return (
    <div className="bg-[#2D3033] rounded-xl p-6 mb-6">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#B7B7B7]"></i>
          <input
            type="text"
            placeholder="Rechercher par nom de client, email, ou numéro de dossier..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] placeholder-[#B7B7B7] focus:outline-none focus:border-[#00F0FF] transition-colors"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B7B7B7] hover:text-[#F9F9F9] transition-colors"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <select
            value={searchParams.get("status") || "all"}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] focus:outline-none focus:border-[#00F0FF] transition-colors cursor-pointer"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={searchParams.get("sort") || "recent"}
            onChange={(e) => handleSortChange(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] focus:outline-none focus:border-[#00F0FF] transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-[#B7B7B7]">
          {totalDossiers} dossier{totalDossiers > 1 ? "s" : ""}
          {hasFilters && " (filtré)"}
        </div>
      </div>
    </div>
  );
}
