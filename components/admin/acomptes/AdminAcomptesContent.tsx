"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { AcompteRow } from "@/app/api/admin/acomptes/route";
import type { AdminOrderRow } from "@/app/api/admin/orders/route";

type Tab = "acomptes" | "orders";

export function AdminAcomptesContent() {
  const [tab, setTab] = useState<Tab>("acomptes");
  const [acomptes, setAcomptes] = useState<AcompteRow[]>([]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loadingAcomptes, setLoadingAcomptes] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAcomptes = useCallback(async () => {
    setLoadingAcomptes(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/acomptes");
      if (!res.ok) throw new Error("Failed to fetch acomptes");
      const data = await res.json();
      setAcomptes(data.acomptes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoadingAcomptes(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchAcomptes();
  }, [fetchAcomptes]);

  useEffect(() => {
    if (tab === "orders") fetchOrders();
  }, [tab, fetchOrders]);

  const handleMarkBalancePaid = useCallback(
    async (depositOrderId: string) => {
      setMarkingId(depositOrderId);
      setError(null);
      try {
        const res = await fetch("/api/admin/acomptes/mark-balance-paid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deposit_order_id: depositOrderId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Échec");
        }
        await fetchAcomptes();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setMarkingId(null);
      }
    },
    [fetchAcomptes]
  );

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Acomptes
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Gérer les soldes après acompte et consulter les commandes
            </p>
          </div>

          <div className="bg-brand-dark-surface p-1 rounded-lg inline-flex mb-6">
            <button
              onClick={() => setTab("acomptes")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === "acomptes"
                  ? "bg-brand-text-primary text-brand-dark-bg"
                  : "text-brand-text-secondary hover:text-brand-text-primary"
              }`}
            >
              Acomptes
            </button>
            <button
              onClick={() => setTab("orders")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === "orders"
                  ? "bg-brand-text-primary text-brand-dark-bg"
                  : "text-brand-text-secondary hover:text-brand-text-primary"
              }`}
            >
              Toutes les commandes
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          {tab === "acomptes" && (
            <div className="bg-brand-card-bg rounded-lg overflow-hidden">
              {loadingAcomptes ? (
                <div className="p-8 text-center text-brand-text-secondary">
                  Chargement…
                </div>
              ) : acomptes.length === 0 ? (
                <div className="p-8 text-center text-brand-text-secondary">
                  Aucune commande acompte payée.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-brand-dark-surface text-brand-text-secondary text-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium">Client</th>
                        <th className="px-4 py-3 font-medium">
                          Produit acompte
                        </th>
                        <th className="px-4 py-3 font-medium">
                          Produit complet
                        </th>
                        <th className="px-4 py-3 font-medium">Montant payé</th>
                        <th className="px-4 py-3 font-medium">Solde restant</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-brand-text-primary divide-y divide-brand-stroke">
                      {acomptes.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3">
                            {row.client?.full_name ?? row.user_id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3">
                            {row.product_deposit?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {row.product_full?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(row.amount)}
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(row.balance_remaining)}
                          </td>
                          <td className="px-4 py-3">
                            {row.has_balance_order ? (
                              <span className="text-brand-text-secondary text-sm">
                                Solde encaissé
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkBalancePaid(row.id)}
                                disabled={markingId === row.id}
                                className="text-sm px-3 py-1.5 rounded bg-brand-accent text-brand-dark-bg hover:opacity-90 disabled:opacity-50"
                              >
                                {markingId === row.id
                                  ? "En cours…"
                                  : "Marquer solde payé"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "orders" && (
            <div className="bg-brand-card-bg rounded-lg overflow-hidden">
              {loadingOrders ? (
                <div className="p-8 text-center text-brand-text-secondary">
                  Chargement…
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-brand-text-secondary">
                  Aucune commande.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-brand-dark-surface text-brand-text-secondary text-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium">Ref</th>
                        <th className="px-4 py-3 font-medium">Client</th>
                        <th className="px-4 py-3 font-medium">Produit</th>
                        <th className="px-4 py-3 font-medium">Montant</th>
                        <th className="px-4 py-3 font-medium">Payé</th>
                        <th className="px-4 py-3 font-medium">Statut</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-brand-text-primary divide-y divide-brand-stroke">
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-4 py-3 font-mono text-sm">
                            {o.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3">
                            {o.client?.full_name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {o.product?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(o.amount)}
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(o.amount_paid)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                o.status === "PAID"
                                  ? "text-green-500"
                                  : "text-brand-text-secondary"
                              }
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-brand-text-secondary">
                            {new Date(o.created_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="text-sm text-brand-accent hover:underline"
                            >
                              Voir / Gérer paiements
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
