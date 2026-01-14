"use client";

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const SORT_OPTIONS = [
  { value: "date_desc", label: "Plus récent" },
  { value: "date_asc", label: "Plus ancien" },
  { value: "name_asc", label: "Nom (A-Z)" },
  { value: "name_desc", label: "Nom (Z-A)" },
  { value: "progress_asc", label: "Progression (croissante)" },
  { value: "progress_desc", label: "Progression (décroissante)" },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <label
        htmlFor="sort-dropdown"
        className="text-sm font-medium text-brand-text-secondary whitespace-nowrap"
      >
        Trier par:
      </label>
      <select
        id="sort-dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-brand-dark-surface border border-brand-dark-border rounded-lg px-4 py-2 text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent hover:border-brand-accent/50 transition-colors min-h-[44px] min-w-[200px]"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
