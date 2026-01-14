"use client";

import { PaymentLinkAnalytics } from "@/types/payment-links";

interface AnalyticsCardsProps {
  analytics: PaymentLinkAnalytics;
}

export function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Links Created */}
      <div className="bg-brand-card-bg border border-brand-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-text-secondary text-sm font-medium">
              Total Links
            </p>
            <p className="text-3xl font-bold text-brand-text-primary mt-2">
              {analytics.total_links.toLocaleString()}
            </p>
          </div>
          <div className="text-brand-accent text-3xl">📊</div>
        </div>
      </div>

      {/* Active Links */}
      <div className="bg-brand-card-bg border border-brand-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-text-secondary text-sm font-medium">
              Active Links
            </p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {analytics.active_links.toLocaleString()}
            </p>
          </div>
          <div className="text-green-400 text-3xl">✓</div>
        </div>
        <p className="text-brand-text-secondary text-xs mt-2">
          Not yet used, not expired
        </p>
      </div>

      {/* Conversion Rate */}
      <div className="bg-brand-card-bg border border-brand-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-text-secondary text-sm font-medium">
              Conversion Rate
            </p>
            <p className="text-3xl font-bold text-brand-accent mt-2">
              {analytics.conversion_rate.toFixed(1)}%
            </p>
          </div>
          <div className="text-brand-accent text-3xl">💰</div>
        </div>
        <p className="text-brand-text-secondary text-xs mt-2">
          Used links with payment
        </p>
      </div>

      {/* Average Time to Conversion */}
      <div className="bg-brand-card-bg border border-brand-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-text-secondary text-sm font-medium">
              Avg Time to Convert
            </p>
            <p className="text-3xl font-bold text-brand-text-primary mt-2">
              {analytics.avg_time_to_conversion_days > 1
                ? `${analytics.avg_time_to_conversion_days.toFixed(1)}d`
                : `${analytics.avg_time_to_conversion_hours.toFixed(1)}h`}
            </p>
          </div>
          <div className="text-brand-text-secondary text-3xl">⏱️</div>
        </div>
        <p className="text-brand-text-secondary text-xs mt-2">
          {analytics.avg_time_to_conversion_days > 1
            ? `${analytics.avg_time_to_conversion_hours.toFixed(1)} hours`
            : `From link creation to payment`}
        </p>
      </div>
    </div>
  );
}
