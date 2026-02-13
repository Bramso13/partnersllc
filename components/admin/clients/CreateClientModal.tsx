"use client";

import { useState, useEffect, useCallback } from "react";

import { useApi } from "@/lib/api/useApi";
import { useClients } from "@/lib/contexts/clients/ClientsContext";
import type { CreateClientData } from "@/lib/contexts/clients/types";

interface Product {
  id: string;
  name: string;
  price_amount: number;
  currency: string;
}

interface CreateClientModalProps {
  open: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

export function CreateClientModal({
  open,
  onClose,
  onClientCreated,
}: CreateClientModalProps) {
  const api = useApi();
  const { createClient } = useClients();
  const [formData, setFormData] = useState<CreateClientData>({
    full_name: "",
    email: "",
    phone: "",
    product_id: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    full_name?: string;
    email?: string;
    phone?: string;
    product_id?: string;
  }>({});

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setError(null);
    try {
      const data = await api.get<{ products?: Product[] }>(
        "/api/admin/products/active"
      );
      setProducts(data?.products ?? []);
    } catch {
      setError("Impossible de charger les produits");
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProducts();
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        product_id: "",
      });
      setError(null);
      setValidationErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!formData.full_name.trim()) {
      errors.full_name = "Le nom complet est obligatoire";
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format d'email invalide";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Le téléphone est obligatoire";
    } else if (formData.phone.trim().length < 8) {
      errors.phone = "Numéro de téléphone invalide (minimum 8 caractères)";
    }

    if (!formData.product_id) {
      errors.product_id = "Veuillez sélectionner un produit";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createClient(formData);
      onClientCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateClientData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    const dollars = amount / 100;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(dollars);
  };

  const isFormValid =
    formData.full_name.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    formData.product_id &&
    Object.keys(validationErrors).length === 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#2D3033] rounded-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#F9F9F9]">Créer un client</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#363636] rounded-lg transition-colors"
          >
            <i className="fa-solid fa-times text-[#B7B7B7]"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F9F9F9] mb-2">
              Nom complet *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              placeholder="Jean Dupont"
              className={`w-full px-4 py-3 bg-[#191A1D] border rounded-lg text-[#F9F9F9] placeholder-[#B7B7B7] focus:outline-none transition-colors ${
                validationErrors.full_name
                  ? "border-red-500 focus:border-red-500"
                  : "border-[#363636] focus:border-[#50B88A]"
              }`}
            />
            {validationErrors.full_name && (
              <p className="text-xs text-red-400 mt-1">
                {validationErrors.full_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#F9F9F9] mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="jean.dupont@example.com"
              className={`w-full px-4 py-3 bg-[#191A1D] border rounded-lg text-[#F9F9F9] placeholder-[#B7B7B7] focus:outline-none transition-colors ${
                validationErrors.email
                  ? "border-red-500 focus:border-red-500"
                  : "border-[#363636] focus:border-[#50B88A]"
              }`}
            />
            {validationErrors.email && (
              <p className="text-xs text-red-400 mt-1">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#F9F9F9] mb-2">
              Téléphone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className={`w-full px-4 py-3 bg-[#191A1D] border rounded-lg text-[#F9F9F9] placeholder-[#B7B7B7] focus:outline-none transition-colors ${
                validationErrors.phone
                  ? "border-red-500 focus:border-red-500"
                  : "border-[#363636] focus:border-[#50B88A]"
              }`}
            />
            {validationErrors.phone && (
              <p className="text-xs text-red-400 mt-1">
                {validationErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#F9F9F9] mb-2">
              Produit *
            </label>
            {isLoadingProducts ? (
              <div className="w-full px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#B7B7B7]">
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Chargement des produits...
              </div>
            ) : (
              <select
                value={formData.product_id}
                onChange={(e) =>
                  handleInputChange("product_id", e.target.value)
                }
                className={`w-full px-4 py-3 bg-[#191A1D] border rounded-lg text-[#F9F9F9] focus:outline-none transition-colors ${
                  validationErrors.product_id
                    ? "border-red-500 focus:border-red-500"
                    : "border-[#363636] focus:border-[#50B88A]"
                }`}
              >
                <option value="">Sélectionner un produit</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} -{" "}
                    {formatPrice(product.price_amount, product.currency)}
                  </option>
                ))}
              </select>
            )}
            {validationErrors.product_id && (
              <p className="text-xs text-red-400 mt-1">
                {validationErrors.product_id}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              <i className="fa-solid fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] hover:border-[#50B88A] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="flex-1 px-4 py-3 bg-[#50B88A] rounded-lg text-white hover:bg-[#4ADE80] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Création...
                </>
              ) : (
                "Créer le client"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
