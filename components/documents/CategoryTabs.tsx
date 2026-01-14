"use client";

type DocumentCategory = "all" | "juridique" | "fiscal" | "bancaire" | "archives";

interface CategoryTabsProps {
  selectedCategory: DocumentCategory;
  onCategoryChange: (category: DocumentCategory) => void;
}

const categories: { value: DocumentCategory; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "juridique", label: "Juridique" },
  { value: "fiscal", label: "Fiscal" },
  { value: "bancaire", label: "Bancaire" },
  { value: "archives", label: "Archivés" },
];

export function CategoryTabs({
  selectedCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="bg-brand-dark-surface p-1 rounded-lg inline-flex">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            selectedCategory === category.value
              ? "bg-brand-text-primary text-brand-dark-bg"
              : "text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
