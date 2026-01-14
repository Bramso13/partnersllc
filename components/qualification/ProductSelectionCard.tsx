"use client";

import { Product } from "@/types/qualification";

interface ProductSelectionCardProps {
  product: Product;
  onSelect: (productId: string) => void;
}

export function ProductSelectionCard({
  product,
  onSelect,
}: ProductSelectionCardProps) {
  const priceInDollars = (product.price_amount / 100).toFixed(2);

  return (
    <div
      className="bg-brand-dark-surface border border-brand-dark-border rounded-2xl p-6 
        transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg cursor-pointer
        group"
      onClick={() => onSelect(product.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-brand-text-secondary line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div>
          <span className="text-2xl font-bold text-brand-text-primary">
            ${priceInDollars}
          </span>
          <span className="text-sm text-brand-text-secondary ml-1">
            {product.currency}
          </span>
        </div>
        <button
          className="px-6 py-2.5 bg-brand-accent text-brand-dark-bg rounded-xl
            font-semibold text-sm transition-all duration-300
            hover:opacity-90 hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(0,240,255,0.3)]
            focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product.id);
          }}
        >
          Sélectionner
        </button>
      </div>
    </div>
  );
}
