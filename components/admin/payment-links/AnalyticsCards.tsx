"use client";

import { PaymentLinkAnalytics } from "@/types/payment-links";

interface AnalyticsCardsProps {
  analytics: PaymentLinkAnalytics;
}

export function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  const cards = [
    {
      label: "Total des liens",
      value: analytics.total_links.toLocaleString(),
      sub: null,
      accent: "text-[#f9f9f9]",
      icon: "fa-solid fa-link",
    },
    {
      label: "Liens actifs",
      value: analytics.active_links.toLocaleString(),
      sub: "Non utilisés, non expirés",
      accent: "text-emerald-400",
      icon: "fa-solid fa-check",
    },
    {
      label: "Taux de conversion",
      value: `${analytics.conversion_rate.toFixed(1)} %`,
      sub: "Liens utilisés avec paiement",
      accent: "text-[#50b989]",
      icon: "fa-solid fa-chart-line",
    },
    {
      label: "Délai moyen",
      value:
        analytics.avg_time_to_conversion_days > 1
          ? `${analytics.avg_time_to_conversion_days.toFixed(1)} j`
          : `${analytics.avg_time_to_conversion_hours.toFixed(1)} h`,
      sub:
        analytics.avg_time_to_conversion_days > 1
          ? `${analytics.avg_time_to_conversion_hours.toFixed(1)} heures`
          : "Création → paiement",
      accent: "text-[#f9f9f9]",
      icon: "fa-solid fa-clock",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl bg-[#252628] border border-[#363636] p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-[#b7b7b7]">
                {card.label}
              </p>
              <p className={`text-2xl font-semibold mt-1.5 ${card.accent}`}>
                {card.value}
              </p>
              {card.sub && (
                <p className="text-[10px] text-[#b7b7b7] mt-1.5">{card.sub}</p>
              )}
            </div>
            <div className={`text-xl shrink-0 ${card.accent} opacity-80`}>
              <i className={card.icon} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
