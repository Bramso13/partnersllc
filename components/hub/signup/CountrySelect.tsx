"use client";

import Select, { type SingleValue, type StylesConfig } from "react-select";
import { getCountryOptionsWithFlags, type CountryOption } from "@/lib/hub/countries";

export interface CountrySelectProps {
  value: CountryOption | null;
  onChange: (option: CountryOption | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  id?: string;
  "aria-label"?: string;
}

const selectStyles: StylesConfig<CountryOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    backgroundColor: "var(--color-surface)",
    borderColor: state.isFocused ? "var(--color-accent)" : "var(--color-border)",
    borderWidth: 1,
    borderRadius: 12,
    boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 240, 255, 0.2)" : "none",
    "&:hover": {
      borderColor: "var(--color-accent)",
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "var(--color-border)" : "transparent",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--color-text-primary)",
  }),
  input: (base) => ({
    ...base,
    color: "var(--color-text-primary)",
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--color-text-secondary)",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "var(--color-text-secondary)",
  }),
};

const options = getCountryOptionsWithFlags();

export function CountrySelect({
  value,
  onChange,
  placeholder = "Sélectionner un pays",
  isDisabled = false,
  id,
  "aria-label": ariaLabel,
}: CountrySelectProps) {
  const handleChange = (option: SingleValue<CountryOption>) => {
    onChange(option);
  };

  return (
    <Select<CountryOption>
      inputId={id}
      aria-label={ariaLabel}
      value={value}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      isClearable
      isSearchable
      isDisabled={isDisabled}
      styles={selectStyles}
      noOptionsMessage={() => "Aucun pays trouvé"}
      loadingMessage={() => "Recherche..."}
    />
  );
}
