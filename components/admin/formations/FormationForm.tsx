"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Formation,
  CreateFormationRequest,
  UpdateFormationRequest,
  FormationVisibilityType,
} from "@/types/formations";
import { Product } from "@/types/products";
import { toast } from "sonner";
import { useApi } from "@/lib/api/useApi";

interface FormationFormProps {
  formation: Formation | null;
  onSaved: (formation: Formation) => void;
}

export function FormationForm({ formation, onSaved }: FormationFormProps) {
  const api = useApi();
  const [titre, setTitre] = useState(formation?.titre || "");
  const [description, setDescription] = useState(formation?.description || "");
  const [visibilityType, setVisibilityType] = useState<FormationVisibilityType>(
    formation?.visibility_type || "all"
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    formation?.visibility_type === "by_product_ids"
      ? (formation.visibility_config as { product_ids?: string[] })
          .product_ids || []
      : []
  );
  const [vignettePreview, setVignettePreview] = useState<string | null>(
    formation?.vignette_url || formation?.vignette_path || null
  );
  const [vignetteFile, setVignetteFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get<{ products?: Product[] }>(
        "/api/admin/products"
      );
      setProducts(data?.products ?? []);
    } catch {
      // keep current
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleVignetteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVignetteFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVignettePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadVignette = async (): Promise<string | null> => {
    if (!vignetteFile) return null;

    const formData = new FormData();
    formData.append("file", vignetteFile);
    formData.append("bucket", "formation-images");
    formData.append("folder", "vignettes");

    try {
      const data = await api.post<{ path?: string; url?: string }>(
        "/api/admin/formations/upload",
        formData
      );
      return data?.path ?? data?.url ?? null;
    } catch {
      toast.error("Erreur lors de l'upload de la vignette");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setLoading(true);

    try {
      // Upload vignette if a new file was selected
      let vignetteUrl = formation?.vignette_url || null;
      let vignettePath = formation?.vignette_path || null;

      if (vignetteFile) {
        const uploadedPath = await uploadVignette();
        if (uploadedPath) {
          vignettePath = uploadedPath;
          vignetteUrl = null; // Clear URL if we have a path
        }
      }

      // Build visibility config
      let visibility_config: any = {};
      if (visibilityType === "by_product_ids") {
        visibility_config = { product_ids: selectedProductIds };
      }

      const payload: CreateFormationRequest | UpdateFormationRequest = {
        titre: titre.trim(),
        description: description.trim() || undefined,
        vignette_url: vignetteUrl || undefined,
        vignette_path: vignettePath || undefined,
        visibility_type: visibilityType,
        visibility_config,
      };

      const data = formation
        ? await api.put<{ formation: Formation }>(
            `/api/admin/formations/${formation.id}`,
            payload
          )
        : await api.post<{ formation: Formation }>(
            "/api/admin/formations",
            payload
          );
      onSaved(data.formation);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-brand-card-bg border border-brand-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-6">
          Informations de la formation
        </h2>

        <div className="space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Titre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="w-full px-4 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="Ex: Introduction à la LLC"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="Description de la formation..."
            />
          </div>

          {/* Vignette */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Vignette
            </label>
            <div className="flex items-start gap-4">
              {vignettePreview && (
                <div className="w-32 h-32 rounded-lg overflow-hidden border border-brand-border">
                  <img
                    src={vignettePreview}
                    alt="Vignette"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleVignetteChange}
                  className="block w-full text-sm text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-accent file:text-white hover:file:bg-brand-accent/90"
                />
                <p className="text-sm text-brand-text-secondary mt-2">
                  Formats acceptés: JPG, PNG, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Visibilité */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Visibilité <span className="text-red-400">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="all"
                  checked={visibilityType === "all"}
                  onChange={(e) =>
                    setVisibilityType(e.target.value as FormationVisibilityType)
                  }
                  className="w-4 h-4 text-brand-accent"
                />
                <span className="text-brand-text-primary">
                  Tous les clients
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="by_product_ids"
                  checked={visibilityType === "by_product_ids"}
                  onChange={(e) =>
                    setVisibilityType(e.target.value as FormationVisibilityType)
                  }
                  className="w-4 h-4 text-brand-accent"
                />
                <span className="text-brand-text-primary">
                  Réservé aux produits sélectionnés
                </span>
              </label>
            </div>

            {/* Product selection */}
            {visibilityType === "by_product_ids" && (
              <div className="mt-4 p-4 bg-brand-dark-bg/50 rounded-lg">
                <p className="text-sm text-brand-text-secondary mb-3">
                  Sélectionnez les produits:
                </p>
                {loadingProducts ? (
                  <p className="text-sm text-brand-text-secondary">
                    Chargement des produits...
                  </p>
                ) : products.length === 0 ? (
                  <p className="text-sm text-brand-text-secondary">
                    Aucun produit disponible
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {products.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-brand-dark-bg/50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                          className="w-4 h-4 text-brand-accent"
                        />
                        <span className="text-brand-text-primary">
                          {product.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading
            ? "Enregistrement..."
            : formation
              ? "Mettre à jour"
              : "Créer la formation"}
        </button>
      </div>
    </form>
  );
}
