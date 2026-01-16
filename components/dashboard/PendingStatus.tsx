"use client";

import { OrderWithProduct, needsPayment, isPaidOrder } from "@/types/orders";
import { OrderCard } from "./OrderCard";

interface PendingStatusProps {
  orders: OrderWithProduct[];
}

export function PendingStatus({ orders }: PendingStatusProps) {
  const pendingOrders = orders.filter(needsPayment);
  const paidOrders = orders.filter(isPaidOrder);

  // If no orders at all
  if (orders.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">?</span>
          <h2 className="text-xl font-semibold text-foreground">
            Aucune commande trouvée
          </h2>
        </div>
        <p className="text-text-secondary">
          Aucune commande n'a été trouvée pour votre compte. Si vous pensez qu'il
          s'agit d'une erreur, veuillez contacter le support.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Orders Section */}
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
          <p className="text-text-secondary mb-6">
            Complétez votre paiement pour activer votre compte et accéder à votre
            dossier.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Paid Orders Section */}
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

      {/* Info box if only paid orders and profile still pending */}
      {pendingOrders.length === 0 && paidOrders.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-info-circle text-blue-500 mt-0.5"></i>
            <div>
              <p className="text-foreground font-medium">
                Vos paiements ont été reçus
              </p>
              <p className="text-text-secondary text-sm mt-1">
                Votre compte est en cours d'activation. Cette page se mettra à jour
                automatiquement une fois le processus terminé.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
