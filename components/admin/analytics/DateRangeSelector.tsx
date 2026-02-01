"use client";

import { useState } from "react";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeSelectorProps {
  onRangeChange: (range: DateRange | null) => void;
}

const PRESETS = [
  { label: "7 j", value: "7" },
  { label: "30 j", value: "30" },
  { label: "90 j", value: "90" },
  { label: "Tout", value: "all" },
] as const;

export function DateRangeSelector({ onRangeChange }: DateRangeSelectorProps) {
  const [activePreset, setActivePreset] = useState<string>("90");

  const handlePresetClick = (days: string) => {
    setActivePreset(days);
    if (days === "all") {
      onRangeChange(null);
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days, 10));
    onRangeChange({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[#252628] border border-[#363636]">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => handlePresetClick(p.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activePreset === p.value
              ? "bg-[#50b989] text-[#191a1d]"
              : "text-[#b7b7b7] hover:text-[#f9f9f9] hover:bg-[#363636]/50"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
