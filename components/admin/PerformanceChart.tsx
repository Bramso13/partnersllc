"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/lib/api/useApi";

interface PerformanceChartProps {
  agentId: string;
}

interface ChartDataPoint {
  date: string;
  count: number;
}

export function PerformanceChart({ agentId }: PerformanceChartProps) {
  const api = useApi();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChartData = useCallback(async () => {
    try {
      const data = await api.get<ChartDataPoint[]>(
        `/api/admin/dashboard/chart?agentId=${agentId}`
      );
      setChartData(Array.isArray(data) ? data : []);
    } catch {
      // keep empty chart
    } finally {
      setLoading(false);
    }
  }, [api, agentId]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  if (loading) {
    return (
      <div className="bg-brand-dark-bg border border-brand-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
          Performance (30 jours)
        </h2>
        <div className="text-center py-8 text-brand-text-secondary">
          Chargement...
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-brand-dark-bg border border-brand-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
          Performance (30 jours)
        </h2>
        <div className="text-center py-8 text-brand-text-secondary">
          <i className="fa-solid fa-chart-line text-4xl mb-2 opacity-50"></i>
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="bg-brand-dark-bg border border-brand-border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
        Performance (30 jours)
      </h2>
      <div className="space-y-2">
        {chartData.map((point, index) => {
          const date = new Date(point.date);
          const dayLabel = date.getDate();
          const monthLabel = date.toLocaleDateString("fr-FR", {
            month: "short",
          });
          const widthPercent = (point.count / maxCount) * 100;

          return (
            <div key={index} className="flex items-center gap-3">
              <div className="text-xs text-brand-text-secondary w-12 flex-shrink-0">
                {dayLabel} {monthLabel}
              </div>
              <div className="flex-1 bg-brand-dark-bg rounded-full h-6 relative overflow-hidden">
                <div
                  className="bg-brand-accent h-full rounded-full transition-all duration-300"
                  style={{ width: `${widthPercent}%` }}
                >
                  {point.count > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-dark-bg font-medium">
                      {point.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-brand-text-secondary text-center">
        Révisions complétées par jour
      </div>
    </div>
  );
}