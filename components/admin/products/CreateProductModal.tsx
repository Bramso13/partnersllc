"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductFormData, ProductType, Product } from "@/types/products";
import { useProducts } from "@/lib/contexts/products/ProductsContext";

interface CreateProductModalProps {
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

export function CreateProductModal({
  onClose,
  onSuccess,
}: CreateProductModalProps) {
  const router = useRouter();
  const { createProduct, products: allProducts } = useProducts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    type: "LLC",
    price: 0,
    stripe_product_id: "",
    stripe_price_id: "",
    active: true,
    is_deposit: false,
    full_product_id: null,
  });

  const fullProducts = allProducts.filter((p: Product) => !p.is_deposit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.name.length < 3 || formData.name.length > 100) {
        throw new Error("Name must be between 3 and 100 characters");
      }

      if (formData.price < 0.01) {
        throw new Error("Price must be at least $0.01");
      }

      if (!formData.stripe_product_id.startsWith("prod_")) {
        throw new Error("Invalid Stripe Product ID format");
      }

      if (!formData.stripe_price_id.startsWith("price_")) {
        throw new Error("Invalid Stripe Price ID format");
      }

      if (formData.is_deposit && !formData.full_product_id) {
        throw new Error("Un produit acompte doit être associé à un produit complet");
      }

      const product = await createProduct(formData);

      router.push(`/admin/products/${product.id}/workflow`);
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
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-card">
          <h2 className="text-xl font-semibold text-brand-text-primary">
            Create New Product
          </h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

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
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Stripe Product ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.stripe_product_id}
              onChange={(e) =>
                setFormData({ ...formData, stripe_product_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent font-mono text-sm"
              placeholder="prod_xxxxxxxxxxxxx"
              pattern="prod_.*"
            />
            <p className="mt-1 text-xs text-brand-text-secondary">
              Create this in your Stripe Dashboard first
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Stripe Price ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.stripe_price_id}
              onChange={(e) =>
                setFormData({ ...formData, stripe_price_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent font-mono text-sm"
              placeholder="price_xxxxxxxxxxxxx"
              pattern="price_.*"
            />
            <p className="mt-1 text-xs text-brand-text-secondary">
              Create this in your Stripe Dashboard first
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_deposit"
              checked={formData.is_deposit || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_deposit: e.target.checked,
                  full_product_id: e.target.checked ? formData.full_product_id : null,
                })
              }
              className="w-4 h-4 rounded border-brand-border bg-brand-dark-bg text-brand-accent focus:ring-2 focus:ring-brand-accent"
            />
            <label
              htmlFor="is_deposit"
              className="text-sm text-brand-text-primary cursor-pointer"
            >
              Produit acompte
            </label>
          </div>

          {formData.is_deposit && (
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-1">
                Produit complet associé <span className="text-red-400">*</span>
              </label>
              <select
                  required
                  value={formData.full_product_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      full_product_id: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="">Sélectionner un produit complet</option>
                  {fullProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${(product.price_amount / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              <p className="mt-1 text-xs text-brand-text-secondary">
                Sélectionnez le produit complet auquel cet acompte est associé
              </p>
            </div>
          )}

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
              {loading ? "Creating..." : "Save & Configure Workflow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
