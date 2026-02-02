"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/products";
import { ProductsTable } from "./ProductsTable";
import { CreateProductModal } from "./CreateProductModal";
import { StepsTabContent } from "./StepsTabContent";

type TabId = "produit" | "steps";

export function ProductsContent() {
  const [activeTab, setActiveTab] = useState<TabId>("produit");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProducts = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
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
      {/* Tabs */}
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
      </div>

      {activeTab === "produit" && (
        <>
          {/* Action Bar */}
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
    </div>
  );
}
