"use client";

import { useState, useEffect, useRef } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onChangeRef = useRef(onChange);
  
  // Keep onChange ref updated without causing re-renders
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only set timer if localValue differs from external value
    // This means user has typed something new
    if (localValue !== value) {
      debounceTimerRef.current = setTimeout(() => {
        // Use ref to get latest onChange without dependency
        onChangeRef.current(localValue);
      }, debounceMs);
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localValue, value, debounceMs]);

  // Sync with external value changes (e.g., from URL or external updates)
  // This only runs when external value changes, not when localValue changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue("");
    onChangeRef.current("");
  };

  return (
    <div className="relative flex-1 min-w-[200px]">
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-brand-dark-surface border border-brand-dark-border rounded-lg px-4 py-2 pl-10 pr-10 text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent hover:border-brand-accent/50 transition-colors min-h-[44px]"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <i className="fa-solid fa-search text-brand-text-secondary text-sm"></i>
        </div>
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            aria-label="Effacer la recherche"
          >
            <i className="fa-solid fa-times text-sm"></i>
          </button>
        )}
      </div>
    </div>
  );
}
