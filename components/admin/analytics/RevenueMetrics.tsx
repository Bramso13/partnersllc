"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { useApi } from "@/lib/api/useApi";

interface RevenueData {
  encaisse: number;
  signe: number;
  restant: number;
}

const cards: {
  key: keyof RevenueData;
  label: string;
  icon: string;
  accent: string;
}[] = [
  {
    key: "encaisse",
    label: "Encaissé",
    icon: "fa-solid fa-circle-check",
    accent: "text-emerald-400",
  },
  {
    key: "signe",
    label: "Signé",
    icon: "fa-solid fa-pen-fancy",
    accent: "text-blue-400",
  },
  {
    key: "restant",
    label: "Restant",
    icon: "fa-solid fa-clock",
    accent: "text-amber-400",
  },
];

export function RevenueMetrics() {
  const api = useApi();
  const [revenue, setRevenue] = useState<RevenueData>({
    encaisse: 0,
    signe: 0,
    restant: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<RevenueData>("/api/admin/revenue");
      setRevenue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  if (error) {
    return (
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-4 text-center">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <button
          type="button"
          onClick={fetchRevenue}
          className="text-sm text-[#50b989] hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#363636] flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#f9f9f9]">Revenus</h2>
        <button
          type="button"
          onClick={fetchRevenue}
          disabled={loading}
          className="text-[#b7b7b7] hover:text-[#f9f9f9] p-1.5 disabled:opacity-50 transition-colors"
          title="Actualiser"
        >
          <i
            className={`fa-solid fa-arrows-rotate ${loading ? "fa-spin" : ""}`}
          />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#363636]">
        {cards.map(({ key, label, icon, accent }) => (
          <div key={key} className="p-5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-[#b7b7b7]">
                {label}
              </span>
              <span className={`text-lg ${accent}`}>
                <i className={icon} />
              </span>
            </div>
            <p className="text-xl font-semibold text-[#f9f9f9]">
              {loading ? "…" : formatCurrency(revenue[key])}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
