"use client";

import { Product } from "@/types/qualification";
import { ProductSelectionCard } from "./ProductSelectionCard";
import { createDossierFromProduct } from "@/app/actions/qualification";
import { useState } from "react";

interface ProductSelectionGridProps {
  products: Product[];
}

export function ProductSelectionGrid({ products }: ProductSelectionGridProps) {
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const handleSelect = async (productId: string) => {
    setLoadingProductId(productId);
    try {
      await createDossierFromProduct(productId);
      // Reload page to show workflow
      window.location.reload();
    } catch (error) {
      console.error("Error selecting product:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sélection du produit"
      );
      setLoadingProductId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="relative">
          {loadingProductId === product.id && (
            <div className="absolute inset-0 bg-brand-dark-surface/80 rounded-2xl flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-brand-text-primary">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Création du dossier...</span>
              </div>
            </div>
          )}
          <ProductSelectionCard
            product={product}
            onSelect={handleSelect}
          />
        </div>
      ))}
    </div>
  );
}
