"use client";

import { useState } from "react";
import { Product } from "@/types/products";

interface DeleteProductButtonProps {
  product: Product;
  onDeleted: () => void;
}

export function DeleteProductButton({
  product,
  onDeleted,
}: DeleteProductButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/products?id=${product.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete product");
      }

      onDeleted();
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-400 hover:text-red-300 font-medium"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border">
          <h3 className="text-lg font-semibold text-brand-text-primary">
            Delete Product
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-brand-text-secondary">
            Are you sure you want to delete{" "}
            <span className="font-medium text-brand-text-primary">
              {product.name}
            </span>
            ?
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-yellow-400">
              ⚠️ This action cannot be undone. The product will be permanently
              deleted.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? "Deleting..." : "Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
