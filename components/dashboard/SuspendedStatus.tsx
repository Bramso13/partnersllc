"use client";

import { bypassPayment } from "@/app/actions/bypass-payment";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types/user";
import { OrderWithProduct, needsPayment, isPaidOrder } from "@/types/orders";
import { OrderCard } from "./OrderCard";

interface SuspendedStatusProps {
  profile: UserProfile & { role?: "CLIENT" | "AGENT" | "ADMIN" };
  orders?: OrderWithProduct[];
}

export function SuspendedStatus({ profile, orders = [] }: SuspendedStatusProps) {
  const [isBypassing, setIsBypassing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const pendingOrders = orders.filter(needsPayment);
  const paidOrders = orders.filter(isPaidOrder);

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
    } catch (err) {
      console.error("Error bypassing payment:", err);
      setError("Une erreur est survenue lors du bypass du paiement.");
      setIsBypassing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="bg-surface border border-red-500 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">?</span>
          <h2 className="text-xl font-semibold text-foreground">
            Compte suspendu - Paiement requis
          </h2>
        </div>
        <p className="text-text-secondary mb-4">
          Votre compte a été suspendu car le paiement n'a pas abouti. Veuillez
          compléter votre paiement ci-dessous pour réactiver votre compte.
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Bypass button for testing */}
        <button
          onClick={handleBypassPayment}
          disabled={isBypassing}
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
              Bypass Payment (Test)
            </>
          )}
        </button>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">?</span>
            <h2 className="text-xl font-semibold text-foreground">
              En attente de paiement
            </h2>
            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-sm font-medium">
              {pendingOrders.length}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Paid Orders */}
      {paidOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">?</span>
            <h2 className="text-xl font-semibold text-foreground">
              Commandes payées
            </h2>
            <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-sm font-medium">
              {paidOrders.length}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {paidOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
