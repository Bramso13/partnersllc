"use client";

import { useState } from "react";
import { Product, ProductType } from "@/types/products";

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

const PRODUCT_TYPES: ProductType[] = [
  "LLC",
  "CORP",
  "DUBAI",
  "BANKING",
  "COMPLIANCE",
  "OTHER",
];

export function EditProductModal({
  product,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    type: product.dossier_type as ProductType,
    price: product.price_amount / 100, // Convert cents to dollars
    active: product.active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (formData.name.length < 3 || formData.name.length > 100) {
        throw new Error("Name must be between 3 and 100 characters");
      }

      if (formData.price < 0.01) {
        throw new Error("Price must be at least $0.01");
      }

      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update product");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-card">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Edit Product
          </h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="e.g., Wyoming LLC Formation"
              minLength={3}
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="Brief description of the product"
              rows={3}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Type <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as ProductType,
                })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {PRODUCT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Price (USD) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-brand-text-secondary">
                $
              </span>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) })
                }
                className="w-full pl-8 pr-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="999.00"
              />
            </div>
            <p className="mt-1 text-xs text-yellow-400">
              ⚠️ Changing price does not affect existing orders
            </p>
          </div>

          {/* Stripe IDs (Read-only) */}
          <div className="bg-brand-dark-bg/50 border border-brand-border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-brand-text-primary">
              Stripe Configuration (Read-only)
            </p>
            <div>
              <p className="text-xs text-brand-text-secondary">Product ID</p>
              <p className="text-sm font-mono text-brand-text-primary">
                {product.stripe_product_id || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary">Price ID</p>
              <p className="text-sm font-mono text-brand-text-primary">
                {product.stripe_price_id || "Not set"}
              </p>
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="w-4 h-4 rounded border-brand-border bg-brand-dark-bg text-brand-accent focus:ring-2 focus:ring-brand-accent"
            />
            <label
              htmlFor="active"
              className="text-sm text-brand-text-primary cursor-pointer"
            >
              Active (available for payment link generation)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
