"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/types/qualification";
import { ProductSelectionCard } from "@/components/qualification/ProductSelectionCard";
import { ProductSelectionGrid } from "@/components/qualification/ProductSelectionGrid";
import { WorkflowContainer } from "@/components/workflow/WorkflowContainer";
import { RejectionWarningBanner } from "./RejectionWarningBanner";
import { createDossierFromProduct } from "@/app/actions/qualification";

interface EmptyStateProps {
  products?: Product[];
  dossierId?: string;
  productId?: string;
  productName?: string;
  rejectedFieldsCount?: number;
  rejectedStepId?: string;
  currentStepInstance?: {
    id: string;
    validation_status?:
      | "DRAFT"
      | "SUBMITTED"
      | "UNDER_REVIEW"
      | "APPROVED"
      | "REJECTED";
  } | null;
  initialStepId?: string;
}

export function EmptyState({
  products: initialProducts,
  dossierId,
  productId,
  productName,
  rejectedFieldsCount,
  rejectedStepId,
  currentStepInstance,
  initialStepId,
}: EmptyStateProps) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(
    dossierId || null
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    productId || null
  );
  const [selectedProductName, setSelectedProductName] = useState<string | null>(
    productName || null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Get step_id from URL if present, or use initialStepId prop
  const stepIdFromUrl =
    searchParams.get("step_id") || initialStepId || undefined;

  // If we have a dossier and product, show workflow
  if (selectedDossierId && selectedProductId && selectedProductName) {
    const validationStatus = currentStepInstance?.validation_status;

    return (
      <div className="bg-brand-dark-surface border border-brand-dark-border rounded-2xl p-6 md:p-8 shadow-lg">
        {/* Rejection Warning Banner */}
        {rejectedFieldsCount && rejectedFieldsCount > 0 && (
          <RejectionWarningBanner
            rejectedFieldsCount={rejectedFieldsCount}
            dossierId={selectedDossierId}
            stepId={rejectedStepId}
          />
        )}

        <div className="mb-6 pb-6 border-b border-brand-dark-border">
          <p className="text-sm text-brand-text-secondary">
            Produit sélectionné
          </p>
          <p className="text-lg font-semibold text-brand-text-primary mt-1">
            {selectedProductName}
          </p>
        </div>

        {/* Status Message */}
        {/* {validationStatus === "SUBMITTED" ||
        validationStatus === "UNDER_REVIEW" ? (
          <div className="bg-brand-warning/10 border border-brand-warning rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <span>⏳</span>
              <span className="text-sm">
                {validationStatus === "SUBMITTED"
                  ? "En attente de validation par notre équipe"
                  : "En cours de révision par notre équipe"}
              </span>
            </div>
          </div>
        ) : validationStatus === "APPROVED" ? (
          <div className="bg-brand-success/10 border border-brand-success rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span className="text-sm">
                Étape validée. Vous pouvez continuer.
              </span>
            </div>
          </div>
        ) : null} */}

        <WorkflowContainer
          dossierId={selectedDossierId}
          productId={selectedProductId}
          productName={selectedProductName}
          initialStepId={stepIdFromUrl}
        />
      </div>
    );
  }

  // Load products if not provided
  useEffect(() => {
    if (products.length === 0) {
      const loadProducts = async () => {
        try {
          const response = await fetch("/api/products");
          if (response.ok) {
            const data = await response.json();
            setProducts(data);
          }
        } catch (error) {
          console.error("Error loading products:", error);
        }
      };
      loadProducts();
    }
  }, []);

  const handleProductSelect = async (product: Product) => {
    setIsLoading(true);
    try {
      await createDossierFromProduct(product.id);
      // After dossier creation, reload the page to show workflow
      window.location.reload();
    } catch (error) {
      console.error("Error selecting product:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sélection du produit"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[500px]">
      <div className="text-center max-w-2xl">
        {/* Animated Icon Container */}
        <div className="mb-8 relative">
          <div className="relative inline-block">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-3xl animate-pulse"></div>
            {/* Main icon container */}
            <div className="relative bg-gradient-to-br from-brand-accent/10 to-brand-accent/5 rounded-3xl p-8 border border-brand-accent/20">
              <div className="flex items-center justify-center space-x-4">
                <div className="relative">
                  <i className="fa-solid fa-rocket text-6xl text-brand-accent animate-bounce"></i>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-brand-success rounded-full animate-ping"></div>
                </div>
                <i className="fa-solid fa-arrow-right text-3xl text-brand-text-secondary/50"></i>
                <i className="fa-solid fa-building text-6xl text-brand-accent"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-brand-text-primary mb-4">
          Créez votre première LLC 🚀
        </h2>

        {/* Description */}
        <p className="text-lg text-brand-text-secondary mb-8 max-w-xl mx-auto">
          Commencez votre aventure entrepreneuriale en quelques minutes.
          Remplissez notre formulaire de qualification et notre équipe
          s'occupera du reste.
        </p>

        {/* Steps Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-brand-dark-surface border border-brand-dark-border rounded-xl p-4 text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-brand-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-brand-accent font-bold text-sm">1</span>
              </div>
              <h4 className="font-semibold text-brand-text-primary text-sm">
                Qualification
              </h4>
            </div>
            <p className="text-xs text-brand-text-secondary">
              Remplissez le formulaire en 5 minutes
            </p>
          </div>

          <div className="bg-brand-dark-surface border border-brand-dark-border rounded-xl p-4 text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-brand-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-brand-accent font-bold text-sm">2</span>
              </div>
              <h4 className="font-semibold text-brand-text-primary text-sm">
                Traitement
              </h4>
            </div>
            <p className="text-xs text-brand-text-secondary">
              Notre équipe traite votre dossier
            </p>
          </div>

          <div className="bg-brand-dark-surface border border-brand-dark-border rounded-xl p-4 text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-brand-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-brand-accent font-bold text-sm">3</span>
              </div>
              <h4 className="font-semibold text-brand-text-primary text-sm">
                Votre LLC
              </h4>
            </div>
            <p className="text-xs text-brand-text-secondary">
              Recevez votre LLC créée
            </p>
          </div>
        </div>

        {/* Product Selection */}
        {products.length > 0 ? (
          <div className="mt-10">
            <ProductSelectionGrid products={products} />
          </div>
        ) : (
          <div className="mt-10">
            <p className="text-brand-text-secondary">
              Chargement des produits...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
