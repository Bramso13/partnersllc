"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/products";
import { ProductsTable } from "./ProductsTable";
import { CreateProductModal } from "./CreateProductModal";

export function ProductsContent() {
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
        <div className="text-brand-text-secondary">Loading products...</div>
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
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          {products.length} product{products.length !== 1 ? "s" : ""} total
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
        >
          + Create Product
        </button>
      </div>

      {/* Products Table */}
      <ProductsTable
        products={products}
        onProductDeleted={handleProductDeleted}
        onProductUpdated={fetchProducts}
      />

      {/* Create Product Modal */}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProductCreated}
        />
      )}
    </div>
  );
}
