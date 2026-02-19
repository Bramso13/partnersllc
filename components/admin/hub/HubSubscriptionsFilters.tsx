"use client";

interface HubSubscriptionsFiltersProps {
  filters: {
    status?: string;
    plan?: string;
    is_llc_client?: boolean;
  };
  onFiltersChange: (f: {
    status?: string;
    plan?: string;
    is_llc_client?: boolean;
  }) => void;
  totalCount: number;
}

export function HubSubscriptionsFilters({
  filters,
  onFiltersChange,
  totalCount,
}: HubSubscriptionsFiltersProps) {
  const hasActiveFilters =
    !!filters.status || !!filters.plan || filters.is_llc_client === true;

  return (
    <div className="bg-[#2D3033] rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-[#B7B7B7] mb-1">
            Statut
          </label>
          <select
            value={filters.status ?? "all"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value === "all" ? undefined : e.target.value,
              })
            }
            className="w-full px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] focus:outline-none focus:border-[#50B88A] transition-colors cursor-pointer"
          >
            <option value="all">Tous</option>
            <option value="active">Actif</option>
            <option value="cancelled">Annulé</option>
            <option value="expired">Expiré</option>
            <option value="suspended">Suspendu</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-[#B7B7B7] mb-1">
            Plan
          </label>
          <select
            value={filters.plan ?? "all"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                plan: e.target.value === "all" ? undefined : e.target.value,
              })
            }
            className="w-full px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] focus:outline-none focus:border-[#50B88A] transition-colors cursor-pointer"
          >
            <option value="all">Tous</option>
            <option value="monthly">Mensuel</option>
            <option value="yearly">Annuel</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.is_llc_client === true}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  is_llc_client: e.target.checked ? true : undefined,
                })
              }
              className="w-4 h-4 rounded border-[#363636] bg-[#191A1D] text-[#50B88A] focus:ring-[#50B88A]"
            />
            <span className="text-sm text-[#F9F9F9]">Client LLC uniquement</span>
          </label>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFiltersChange({})}
            className="px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#B7B7B7] hover:text-[#F9F9F9] hover:border-[#50B88A] transition-colors whitespace-nowrap self-end"
          >
            <i className="fa-solid fa-times mr-2" />
            Réinitialiser
          </button>
        )}
      </div>
      <div className="mt-4 text-sm text-[#B7B7B7]">
        {totalCount} inscription{totalCount !== 1 ? "s" : ""} trouvée
        {totalCount !== 1 ? "s" : ""}
        {hasActiveFilters && " (filtré)"}
      </div>
    </div>
  );
}
