"use client";

import { useState } from "react";
import { createRetryCheckoutSession } from "@/app/actions/checkout";
import {
  OrderWithProduct,
  formatOrderAmount,
  needsPayment,
  isPaidOrder,
} from "@/types/orders";
import Link from "next/link";

interface OrderCardProps {
  order: OrderWithProduct;
}

export function OrderCard({ order }: OrderCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const checkoutUrl = await createRetryCheckoutSession();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError("Impossible de lancer le paiement. Veuillez réessayer.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const getStatusConfig = () => {
    switch (order.status) {
      case "PAID":
        return {
          label: "Payé",
          bgColor: "bg-green-500/10",
          textColor: "text-green-500",
          borderColor: "border-green-500/20",
          icon: "fa-check-circle",
        };
      case "PENDING":
        return {
          label: "En attente",
          bgColor: "bg-yellow-500/10",
          textColor: "text-yellow-500",
          borderColor: "border-yellow-500/20",
          icon: "fa-clock",
        };
      case "FAILED":
        return {
          label: "Échec",
          bgColor: "bg-red-500/10",
          textColor: "text-red-500",
          borderColor: "border-red-500/20",
          icon: "fa-times-circle",
        };
      case "REFUNDED":
        return {
          label: "Remboursé",
          bgColor: "bg-blue-500/10",
          textColor: "text-blue-500",
          borderColor: "border-blue-500/20",
          icon: "fa-rotate-left",
        };
      case "CANCELLED":
        return {
          label: "Annulé",
          bgColor: "bg-gray-500/10",
          textColor: "text-gray-500",
          borderColor: "border-gray-500/20",
          icon: "fa-ban",
        };
      default:
        return {
          label: order.status,
          bgColor: "bg-gray-500/10",
          textColor: "text-gray-500",
          borderColor: "border-gray-500/20",
          icon: "fa-question-circle",
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="bg-surface border border-border rounded-xl p-6 transition-all hover:border-border/80">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {order.product.name}
          </h3>
          {order.product.description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">
              {order.product.description}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
        >
          <i className={`fa-solid ${statusConfig.icon} text-xs`}></i>
          {statusConfig.label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Montant</span>
          <span className="font-medium text-foreground">
            {formatOrderAmount(order)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Date</span>
          <span className="text-foreground">
            {new Date(order.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        {order.paid_at && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Payé le</span>
            <span className="text-foreground">
              {new Date(order.paid_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Action Button */}
      {needsPayment(order) && (
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full bg-accent hover:bg-accent/90 text-background font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              Chargement...
            </>
          ) : (
            <>
              <i className="fa-solid fa-credit-card"></i>
              {order.status === "FAILED" ? "Réessayer le paiement" : "Payer maintenant"}
            </>
          )}
        </button>
      )}

      {isPaidOrder(order) && order.dossier_id && (
        <Link
          href={`/dashboard/dossier/${order.dossier_id}`}
          className="w-full bg-accent hover:bg-accent/90 text-background font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-folder-open"></i>
          Voir mon dossier
        </Link>
      )}

      {isPaidOrder(order) && !order.dossier_id && (
        <div className="w-full bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg text-center text-sm">
          <i className="fa-solid fa-check mr-2"></i>
          Paiement confirmé - Dossier en cours de création
        </div>
      )}
    </div>
  );
}
