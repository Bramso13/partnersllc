"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { AdminOrderDetail } from "@/app/api/admin/orders/[id]/route";
import type { OrderPayment } from "@/types/orders";

const PAYMENT_METHODS = [
  { value: "", label: "—" },
  { value: "VIREMENT", label: "Virement" },
  { value: "CHEQUE", label: "Chèque" },
  { value: "STRIPE", label: "Stripe" },
  { value: "AUTRE", label: "Autre" },
] as const;

interface AdminOrderDetailContentProps {
  orderId: string;
}

export function AdminOrderDetailContent({
  orderId,
}: AdminOrderDetailContentProps) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amountEuros, setAmountEuros] = useState("");
  const [paidAt, setPaidAt] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Commande introuvable");
        throw new Error("Erreur chargement");
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleAddPayment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      const euros = parseFloat(amountEuros.replace(",", "."));
      if (Number.isNaN(euros) || euros <= 0) {
        setFormError("Montant invalide (saisir un nombre en euros)");
        return;
      }
      const amountCents = Math.round(euros * 100);
      const paidAtISO = new Date(paidAt).toISOString();
      setSubmitting(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountCents,
            paid_at: paidAtISO,
            payment_method: paymentMethod || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Échec");
        }
        setAmountEuros("");
        setPaidAt(new Date().toISOString().slice(0, 16));
        setPaymentMethod("");
        setShowForm(false);
        await fetchOrder();
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setSubmitting(false);
      }
    },
    [orderId, amountEuros, paidAt, paymentMethod, fetchOrder]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark-bg p-6">
        <div className="max-w-4xl mx-auto text-brand-text-secondary">
          Chargement…
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-brand-dark-bg p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-400 mb-4">{error ?? "Commande introuvable"}</p>
          <Link
            href="/admin/orders"
            className="text-brand-accent hover:underline"
          >
            Retour à la liste des commandes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/admin/orders"
              className="text-sm text-brand-accent hover:underline"
            >
              ← Retour aux commandes
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-brand-text-primary">
              Commande {order.id.slice(0, 8)}
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Détail et paiements
            </p>
          </div>

          <div className="bg-brand-card-bg rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-brand-text-primary mb-4">
              Informations commande
            </h2>
            <dl className="grid gap-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-brand-text-secondary w-32">Client</dt>
                <dd className="text-brand-text-primary">
                  {order.client?.full_name ?? order.user_id}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-brand-text-secondary w-32">Produit</dt>
                <dd className="text-brand-text-primary">
                  {order.product?.name ?? "—"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-brand-text-secondary w-32">
                  Montant total
                </dt>
                <dd className="text-brand-text-primary">
                  {formatCurrency(order.amount)}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-brand-text-secondary w-32">Montant payé</dt>
                <dd className="text-brand-text-primary">
                  {formatCurrency(order.amount_paid)}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-brand-text-secondary w-32">Statut</dt>
                <dd
                  className={
                    order.status === "PAID"
                      ? "text-green-500"
                      : "text-brand-text-primary"
                  }
                >
                  {order.status}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-brand-text-secondary w-32">
                  Date création
                </dt>
                <dd className="text-brand-text-primary">
                  {new Date(order.created_at).toLocaleString("fr-FR")}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-brand-card-bg rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-text-primary">
                Paiements
              </h2>
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="text-sm px-3 py-1.5 rounded bg-brand-accent text-brand-dark-bg hover:opacity-90"
              >
                {showForm ? "Annuler" : "Ajouter un paiement"}
              </button>
            </div>

            {showForm && (
              <form
                onSubmit={handleAddPayment}
                className="mb-6 p-4 rounded-lg bg-brand-dark-surface"
              >
                {formError && (
                  <p className="text-red-400 text-sm mb-3">{formError}</p>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-brand-text-secondary text-sm mb-1">
                      Montant (€)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountEuros}
                      onChange={(e) => setAmountEuros(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-brand-dark-bg border border-brand-stroke rounded px-3 py-2 text-brand-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-brand-text-secondary text-sm mb-1">
                      Date
                    </label>
                    <input
                      type="datetime-local"
                      value={paidAt}
                      onChange={(e) => setPaidAt(e.target.value)}
                      className="w-full bg-brand-dark-bg border border-brand-stroke rounded px-3 py-2 text-brand-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-brand-text-secondary text-sm mb-1">
                      Mode de paiement
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-brand-dark-bg border border-brand-stroke rounded px-3 py-2 text-brand-text-primary"
                    >
                      {PAYMENT_METHODS.map((opt) => (
                        <option key={opt.value || "none"} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="text-sm px-4 py-2 rounded bg-brand-accent text-brand-dark-bg hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </form>
            )}

            {order.payments.length === 0 ? (
              <p className="text-brand-text-secondary text-sm">
                Aucun paiement enregistré pour cette commande.
                {order.status === "PAID" &&
                  " Le montant affiché correspond au paiement Stripe initial."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-brand-text-secondary">
                    <tr>
                      <th className="px-2 py-2 font-medium">Date</th>
                      <th className="px-2 py-2 font-medium">Montant</th>
                      <th className="px-2 py-2 font-medium">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="text-brand-text-primary divide-y divide-brand-stroke">
                    {order.payments.map((p: OrderPayment) => (
                      <tr key={p.id}>
                        <td className="px-2 py-2">
                          {new Date(p.paid_at).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-2 py-2">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-2 py-2">{p.payment_method ?? "—"}</td>
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
