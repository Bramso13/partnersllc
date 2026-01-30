"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { AdminOrderRow } from "@/app/api/admin/orders/route";

export function AdminOrdersContent() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = statusFilter
      ? `/api/admin/orders?status=${encodeURIComponent(statusFilter)}`
      : "/api/admin/orders";
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch orders");
        return res.json();
      })
      .then((data) => setOrders(data.orders ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Commandes
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Liste de toutes les commandes et gestion des paiements
            </p>
          </div>

          <div className="mb-4 flex items-center gap-4">
            <label className="text-brand-text-secondary text-sm">
              Statut :
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-brand-dark-surface text-brand-text-primary border border-brand-stroke rounded px-3 py-1.5 text-sm"
            >
              <option value="">Tous</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="bg-brand-card-bg rounded-lg overflow-hidden">
            {loading ? (
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
                      <th className="px-4 py-3 font-medium">Montant payé</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
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
                        <td className="px-4 py-3">{o.product?.name ?? "—"}</td>
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
                            Détail / Ajouter paiement
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
