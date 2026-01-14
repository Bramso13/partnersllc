"use client";

import { useState } from "react";
import { Product } from "@/types/products";

interface GeneratePaymentLinkModalProps {
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
}

export function GeneratePaymentLinkModal({
  onClose,
  onSuccess,
  products,
}: GeneratePaymentLinkModalProps) {
  const [formData, setFormData] = useState({
    prospect_email: "",
    prospect_name: "",
    product_id: "",
    expires_in_days: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/payment-links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create payment link");
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
      <div className="bg-brand-card-bg border border-brand-border rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-brand-text-primary">
              Generate Payment Link
            </h2>
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text-primary"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prospect Email */}
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                Prospect Email *
              </label>
              <input
                type="email"
                required
                value={formData.prospect_email}
                onChange={(e) =>
                  setFormData({ ...formData, prospect_email: e.target.value })
                }
                className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="prospect@example.com"
              />
            </div>

            {/* Prospect Name */}
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                Prospect Name (Optional)
              </label>
              <input
                type="text"
                value={formData.prospect_name}
                onChange={(e) =>
                  setFormData({ ...formData, prospect_name: e.target.value })
                }
                className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="John Doe"
              />
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                Product *
              </label>
              <select
                required
                value={formData.product_id}
                onChange={(e) =>
                  setFormData({ ...formData, product_id: e.target.value })
                }
                className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="">Select a product...</option>
                {products
                  .filter((p) => p.active)
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.currency}{" "}
                      {(product.price_amount / 100).toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Expires In */}
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                Expires In (Days) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={365}
                value={formData.expires_in_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expires_in_days: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-brand-text-secondary/20 text-brand-text-primary rounded-lg hover:bg-brand-text-secondary/30 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Creating..." : "Generate Link"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
