"use client";

import { useEffect, useState } from "react";

import { useProducts } from "@/lib/contexts/products/ProductsContext";
import { ProductsTable } from "./ProductsTable";
import { CreateProductModal } from "./CreateProductModal";
import { StepsTabContent } from "./StepsTabContent";
import { DocumentTypesTabContent } from "./DocumentTypesTabContent";

type TabId = "produit" | "steps" | "document-types";

export function ProductsContent() {
  const { products, isLoading, error, fetchProducts } = useProducts();
  const [activeTab, setActiveTab] = useState<TabId>("produit");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProducts();
    }, []);

  const handleProductCreated = () => {
    setShowCreateModal(false);
    fetchProducts();
  };

  const handleProductDeleted = () => {
    fetchProducts();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-text-secondary">
          Chargement des produits...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-brand-surface-light rounded-lg p-1">
        <button
          type="button"
          onClick={() => setActiveTab("produit")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "produit"
              ? "bg-brand-card-bg text-brand-text-primary shadow-sm"
              : "text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          Produit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("steps")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "steps"
              ? "bg-brand-card-bg text-brand-text-primary shadow-sm"
              : "text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          Steps
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("document-types")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "document-types"
              ? "bg-brand-card-bg text-brand-text-primary shadow-sm"
              : "text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          Types de documents
        </button>
      </div>

      {activeTab === "produit" && (
        <>
          <div className="flex justify-between items-center">
            <div className="text-brand-text-secondary">
              {products.length} produit{products.length !== 1 ? "s" : ""} au
              total
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
            >
              + Créer un produit
            </button>
          </div>

          <ProductsTable
            products={products}
            onProductDeleted={handleProductDeleted}
            onProductUpdated={fetchProducts}
          />

          {showCreateModal && (
            <CreateProductModal
              onClose={() => setShowCreateModal(false)}
              onSuccess={handleProductCreated}
            />
          )}
        </>
      )}

      {activeTab === "steps" && <StepsTabContent />}

      {activeTab === "document-types" && <DocumentTypesTabContent />}
    </div>
  );
}
