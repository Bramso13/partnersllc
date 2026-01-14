"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeSelectorProps {
  onRangeChange: (range: DateRange | null) => void;
}

export function DateRangeSelector({ onRangeChange }: DateRangeSelectorProps) {
  const [activePreset, setActivePreset] = useState<string>("90");

  const presets = [
    { label: "7 jours", value: "7" },
    { label: "30 jours", value: "30" },
    { label: "90 jours", value: "90" },
    { label: "Tout", value: "all" },
  ];

  const handlePresetClick = (days: string) => {
    setActivePreset(days);
    if (days === "all") {
      onRangeChange(null);
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days));
    
    onRangeChange({
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-brand-dark-surface border border-brand-dark-border rounded-lg">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePresetClick(p.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            activePreset === p.value
              ? "bg-brand-accent text-brand-dark-bg"
              : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-white/5"
          }`}
        >
          {p.label}
        </button>
      ))}
      <div className="h-4 w-px bg-brand-dark-border mx-1" />
      <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary hover:bg-white/5 rounded-md transition-all">
        <Calendar className="w-3.5 h-3.5" />
        Personnalisé
      </button>
    </div>
  );
}
