"use client";

import type { ChangeEvent } from "react";
import { useTranslations } from "next-intl";

interface StepFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: "assigned_at" | "step_type" | "client_name";
  onSortChange: (value: "assigned_at" | "step_type" | "client_name") => void;
  isRefreshing: boolean;
}

export function StepFilters({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  isRefreshing,
}: StepFiltersProps) {
  const t = useTranslations("agent.steps");
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "assigned_at" | "step_type" | "client_name";
    onSortChange(value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex-1 w-full">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 rounded-xl bg-[#191A1D] border border-[#363636] text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="px-3 py-2 rounded-xl bg-[#191A1D] border border-[#363636] text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          <option value="assigned_at">{t("sortAssignedAt")}</option>
          <option value="step_type">{t("sortStepType")}</option>
          <option value="client_name">{t("sortClientName")}</option>
        </select>

        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch("/api/agent/steps");
              if (res.ok) {
                const json = await res.json();
                // Parent se chargera de mettre à jour via onSearchChange/onSortChange
                // Ici on ne fait que forcer un re-rendu en changeant la search si besoin
              }
            } catch (e) {
              console.error("Erreur lors du refresh manuel", e);
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#191A1D] border border-[#363636] text-sm text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-accent transition-colors"
        >
          <i
            className={`fa-solid fa-rotate-right ${
              isRefreshing ? "animate-spin text-brand-accent" : ""
            }`}
          ></i>
          <span>{t("refresh")}</span>
        </button>
      </div>
    </div>
  );
}

