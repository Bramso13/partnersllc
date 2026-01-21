"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { RefreshCw } from "lucide-react";

interface RevenueData {
  encaisse: number;
  signe: number;
  restant: number;
}

export function RevenueMetrics() {
  const [revenue, setRevenue] = useState<RevenueData>({
    encaisse: 0,
    signe: 0,
    restant: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/revenue");
      if (!response.ok) {
        throw new Error("Failed to fetch revenue");
      }
      const data = await response.json();
      setRevenue(data);
    } catch (err) {
      console.error("Error fetching revenue:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 mb-8">
        <p>Erreur : {error}</p>
        <button
          onClick={fetchRevenue}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-brand-text-primary">Revenus</h2>
        <button
          onClick={fetchRevenue}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-dark-surface border border-brand-dark-border rounded-md text-brand-text-primary hover:bg-brand-dark-border transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RevenueCard
          label="Revenu encaissé"
          amount={revenue.encaisse}
          icon="💰"
          color="green"
          loading={loading}
        />
        <RevenueCard
          label="Revenu signé"
          amount={revenue.signe}
          icon="✍️"
          color="blue"
          loading={loading}
        />
        <RevenueCard
          label="Revenu restant"
          amount={revenue.restant}
          icon="⏳"
          color="orange"
          loading={loading}
        />
      </div>
    </div>
  );
}

function RevenueCard({
  label,
  amount,
  icon,
  color,
  loading,
}: {
  label: string;
  amount: number;
  icon: string;
  color: "green" | "blue" | "orange";
  loading: boolean;
}) {
  const colorClasses = {
    green: "border-green-500/30 bg-green-500/10",
    blue: "border-blue-500/30 bg-blue-500/10",
    orange: "border-orange-500/30 bg-orange-500/10",
  };

  return (
    <div
      className={`border rounded-lg p-4 ${colorClasses[color]} transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {loading && (
          <RefreshCw className="w-4 h-4 text-brand-text-secondary animate-spin" />
        )}
      </div>
      <div>
        <p className="text-sm text-brand-text-secondary mb-1">{label}</p>
        <p className="text-2xl font-bold text-brand-text-primary">
          {loading ? "..." : formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
}
