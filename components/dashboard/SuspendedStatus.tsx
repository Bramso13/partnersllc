"use client";

import { createRetryCheckoutSession } from "@/app/actions/checkout";
import { bypassPayment } from "@/app/actions/bypass-payment";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types/user";

interface SuspendedStatusProps {
  profile: UserProfile & { role?: "CLIENT" | "AGENT" | "ADMIN" };
}

export function SuspendedStatus({ profile }: SuspendedStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isBypassing, setIsBypassing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCompletePayment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get the user's order ID - this will be implemented when we have the order data
      // For now, we'll need to fetch it from the database
      const checkoutUrl = await createRetryCheckoutSession();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError("Impossible de créer la session de paiement. Veuillez réessayer.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleBypassPayment = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir bypasser le paiement ? Cette action activera le compte et créera un dossier si nécessaire."
      )
    ) {
      return;
    }

    setIsBypassing(true);
    setError(null);
    try {
      const result = await bypassPayment(profile.id);
      if (result.success) {
        // Refresh the page to show the active dashboard
        router.refresh();
        window.location.reload();
      } else {
        setError(result.error || "Erreur lors du bypass du paiement");
        setIsBypassing(false);
      }
    } catch (error) {
      console.error("Error bypassing payment:", error);
      setError("Une erreur est survenue lors du bypass du paiement.");
      setIsBypassing(false);
    }
  };

  return (
    <div className="bg-surface border border-red-500 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">⚠️</span>
        <h2 className="text-xl font-semibold text-foreground">
          Paiement non réussi
        </h2>
      </div>
      <p className="text-text-secondary mb-6">
        Votre paiement n'a pas abouti. Veuillez compléter votre paiement pour
        accéder à votre dossier.
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCompletePayment}
          disabled={isLoading || isBypassing}
          className="bg-accent hover:bg-accent/90 text-background font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Chargement..." : "Compléter le paiement"}
        </button>

        <button
          onClick={handleBypassPayment}
          disabled={isLoading || isBypassing}
          className="bg-warning hover:bg-warning/90 text-background font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-warning/20"
          title="Bypass payment (for testing)"
        >
          {isBypassing ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              Activation...
            </>
          ) : (
            <>
              <i className="fa-solid fa-bolt mr-2"></i>
              Bypass Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
}
