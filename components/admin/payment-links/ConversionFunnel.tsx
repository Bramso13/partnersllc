"use client";

import { ConversionFunnelData } from "@/types/payment-links";

interface ConversionFunnelProps {
  data: ConversionFunnelData;
}

const STAGES = [
  { key: "created", label: "Liens créés", color: "bg-blue-500" },
  { key: "clicked", label: "Lien cliqué", color: "bg-emerald-500" },
  { key: "registered", label: "Inscription", color: "bg-amber-500" },
  { key: "paid", label: "Paiement effectué", color: "bg-[#50b989]" },
] as const;

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const counts = {
    created: data.created_count,
    clicked: data.clicked_count,
    registered: data.registered_count,
    paid: data.paid_count,
  };
  const total = data.created_count || 1;

  return (
    <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#363636]">
        <h3 className="text-base font-semibold text-[#f9f9f9]">
          Entonnoir de conversion
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {STAGES.map((stage, index) => {
          const count = counts[stage.key];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#b7b7b7]">
                    {index + 1}. {stage.label}
                  </span>
                  <span className="text-sm font-semibold text-[#f9f9f9]">
                    {count.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-[#b7b7b7]">
                  {pct.toFixed(1)} %
                </span>
              </div>
              <div className="h-2 w-full bg-[#1e1f22] rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-6 py-4 border-t border-[#363636] grid grid-cols-3 gap-4 text-center bg-[#1e1f22]/30">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#b7b7b7]">
            Taux de clic
          </p>
          <p className="text-sm font-semibold text-[#f9f9f9] mt-0.5">
            {total > 0 ? ((data.clicked_count / total) * 100).toFixed(1) : "0"}%
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#b7b7b7]">
            Taux d’inscription
          </p>
          <p className="text-sm font-semibold text-[#f9f9f9] mt-0.5">
            {data.clicked_count > 0
              ? ((data.registered_count / data.clicked_count) * 100).toFixed(1)
              : "0"}
            %
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#b7b7b7]">
            Taux de paiement
          </p>
          <p className="text-sm font-semibold text-[#f9f9f9] mt-0.5">
            {data.registered_count > 0
              ? ((data.paid_count / data.registered_count) * 100).toFixed(1)
              : "0"}
            %
          </p>
        </div>
      </div>
    </div>
  );
}
