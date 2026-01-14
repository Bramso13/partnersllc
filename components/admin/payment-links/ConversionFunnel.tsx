"use client";

import { ConversionFunnelData } from "@/types/payment-links";

interface ConversionFunnelProps {
  data: ConversionFunnelData;
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const stages = [
    {
      label: "Links Created",
      count: data.created_count,
      color: "bg-blue-500",
      percentage: 100,
    },
    {
      label: "Link Clicked",
      count: data.clicked_count,
      color: "bg-green-500",
      percentage:
        data.created_count > 0
          ? (data.clicked_count / data.created_count) * 100
          : 0,
    },
    {
      label: "User Registered",
      count: data.registered_count,
      color: "bg-yellow-500",
      percentage:
        data.created_count > 0
          ? (data.registered_count / data.created_count) * 100
          : 0,
    },
    {
      label: "Payment Completed",
      count: data.paid_count,
      color: "bg-brand-accent",
      percentage:
        data.created_count > 0
          ? (data.paid_count / data.created_count) * 100
          : 0,
    },
  ];

  return (
    <div className="bg-brand-card-bg border border-brand-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-6">
        Conversion Funnel
      </h3>

      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.label}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-brand-text-secondary text-sm font-medium">
                  {index + 1}. {stage.label}
                </span>
                <span className="text-brand-text-primary font-semibold">
                  {stage.count.toLocaleString()}
                </span>
              </div>
              <span className="text-brand-text-secondary text-sm">
                {stage.percentage.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-brand-dark-bg rounded-full h-8 overflow-hidden">
              <div
                className={`${stage.color} h-full flex items-center justify-center text-white text-sm font-medium transition-all duration-500`}
                style={{ width: `${stage.percentage}%` }}
              >
                {stage.percentage > 15 && `${stage.percentage.toFixed(1)}%`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-brand-border grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-brand-text-secondary text-xs">Click Rate</p>
          <p className="text-brand-text-primary font-semibold">
            {data.created_count > 0
              ? ((data.clicked_count / data.created_count) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
        <div>
          <p className="text-brand-text-secondary text-xs">
            Registration Rate
          </p>
          <p className="text-brand-text-primary font-semibold">
            {data.clicked_count > 0
              ? ((data.registered_count / data.clicked_count) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
        <div>
          <p className="text-brand-text-secondary text-xs">Payment Rate</p>
          <p className="text-brand-text-primary font-semibold">
            {data.registered_count > 0
              ? ((data.paid_count / data.registered_count) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  );
}
