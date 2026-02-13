"use client";

import { useState } from "react";
import { Product } from "@/types/products";
import { usePaymentLinks } from "@/lib/contexts/payment-links/PaymentLinksContext";

interface GeneratePaymentLinkModalProps {
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-sm placeholder-[#b7b7b7]/60 focus:outline-none focus:ring-2 focus:ring-[#50b989] focus:border-transparent";

export function GeneratePaymentLinkModal({
  onClose,
  onSuccess,
  products,
}: GeneratePaymentLinkModalProps) {
  const { createPaymentLink } = usePaymentLinks();
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
      await createPaymentLink(formData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const activeProducts = products.filter((p) => p.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl bg-[#252628] border border-[#363636] w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#363636] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#f9f9f9]">
            Générer un lien de paiement
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-[#b7b7b7] hover:text-[#f9f9f9] text-xl leading-none disabled:opacity-50 transition-colors"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
              Email du prospect <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.prospect_email}
              onChange={(e) =>
                setFormData({ ...formData, prospect_email: e.target.value })
              }
              className={inputClass}
              placeholder="prospect@exemple.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
              Nom du prospect
            </label>
            <input
              type="text"
              value={formData.prospect_name}
              onChange={(e) =>
                setFormData({ ...formData, prospect_name: e.target.value })
              }
              className={inputClass}
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
              Produit <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.product_id}
              onChange={(e) =>
                setFormData({ ...formData, product_id: e.target.value })
              }
              className={inputClass}
            >
              <option value="">Sélectionner un produit</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
              Expiration (jours)
            </label>
            <input
              type="number"
              min={1}
              value={formData.expires_in_days}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expires_in_days: parseInt(e.target.value, 10) || 30,
                })
              }
              className={inputClass}
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-[#363636] text-[#f9f9f9] text-sm font-medium hover:bg-[#363636]/50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#50b989] text-[#191a1d] text-sm font-medium hover:bg-[#50b989]/90 disabled:opacity-50"
            >
              {loading ? "Création…" : "Générer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
