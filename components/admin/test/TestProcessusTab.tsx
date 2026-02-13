"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useBackoffice } from "@/lib/contexts/backoffice/BackofficeContext";
import { useProducts } from "@/lib/contexts/products/ProductsContext";
import type { Product } from "@/lib/contexts/products/types";

type TestProcessusTabProps = {
  testEmail: string;
  testPhone: string;
  onGoToConfig: () => void;
};

type DossierEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

type NotificationDelivery = {
  id: string;
  channel: string;
  status: string;
  recipient: string;
  sent_at: string | null;
  failed_at: string | null;
  provider_response?: Record<string, unknown> | null;
  created_at: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  template_code: string | null;
  created_at: string;
  dossier_id: string | null;
  notification_deliveries: NotificationDelivery[];
};

type DossierSummary = {
  id: string;
  status: string;
  created_at: string;
  client?: { id: string; full_name: string } | null;
  product?: { id: string; name: string } | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SENT: "text-green-400 bg-green-400/10 border-green-400/30",
    FAILED: "text-red-400 bg-red-400/10 border-red-400/30",
    PENDING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    QUALIFICATION: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    IN_PROGRESS: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    COMPLETED: "text-green-400 bg-green-400/10 border-green-400/30",
    CANCELLED: "text-red-400 bg-red-400/10 border-red-400/30",
  };
  const cls = colors[status] ?? "text-[#b7b7b7] bg-[#252628] border-[#363636]";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
}

export function TestProcessusTab({
  testEmail,
  testPhone,
  onGoToConfig,
}: TestProcessusTabProps) {
  const { createDossierWithNewClient, getDossierSummary } = useBackoffice();
  const { fetchActiveProducts } = useProducts();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Created dossier state
  const [createdDossierId, setCreatedDossierId] = useState<string | null>(null);
  const [createdClientEmail, setCreatedClientEmail] = useState<string | null>(null);

  // Observation data
  const [dossierSummary, setDossierSummary] = useState<DossierSummary | null>(null);
  const [events, setEvents] = useState<DossierEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingObs, setIsLoadingObs] = useState(false);

  useEffect(() => {
    fetchActiveProducts()
      .then(setProducts)
      .catch(() => toast.error("Erreur lors du chargement des produits"))
      .finally(() => setIsLoadingProducts(false));
  }, [fetchActiveProducts]);

  const loadObservation = useCallback(async (dossierId: string) => {
    setIsLoadingObs(true);
    try {
      const [summaryRes, eventsRes, notifRes] = await Promise.all([
        getDossierSummary(dossierId),
        fetch(`/api/admin/dossiers/${dossierId}/events`).then((r) => r.json()),
        fetch(`/api/admin/notifications?dossier_id=${dossierId}&limit=100`).then((r) => r.json()),
      ]);

      setDossierSummary(summaryRes as DossierSummary | null);
      setEvents(Array.isArray(eventsRes) ? eventsRes : []);
      setNotifications(notifRes?.notifications ?? []);
    } catch {
      toast.error("Erreur lors du chargement des données d'observation");
    } finally {
      setIsLoadingObs(false);
    }
  }, [getDossierSummary]);

  const handleCreate = useCallback(async () => {
    if (!testEmail) {
      toast.error("Email de test requis. Configurez-le dans l'onglet Config.");
      onGoToConfig();
      return;
    }
    if (!selectedProductId) {
      toast.error("Veuillez sélectionner un produit");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createDossierWithNewClient({
        full_name: "Client Test",
        email: testEmail,
        phone: testPhone || "+33000000000",
        product_id: selectedProductId,
        initial_status: "QUALIFICATION",
      });
      setCreatedDossierId(res.dossierId);
      setCreatedClientEmail(testEmail);
      toast.success("Dossier de test créé avec succès");
      await loadObservation(res.dossierId);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la création du dossier"
      );
    } finally {
      setIsCreating(false);
    }
  }, [
    testEmail,
    testPhone,
    selectedProductId,
    createDossierWithNewClient,
    loadObservation,
    onGoToConfig,
  ]);

  const handleRefresh = useCallback(async () => {
    if (!createdDossierId) return;
    await loadObservation(createdDossierId);
  }, [createdDossierId, loadObservation]);

  // Derived: email deliveries + whatsapp deliveries from notifications
  const allDeliveries = notifications.flatMap((n) =>
    (n.notification_deliveries ?? []).map((d) => ({ ...d, notifTitle: n.title }))
  );
  const emailDeliveries = allDeliveries.filter((d) => d.channel === "EMAIL");
  const whatsappDeliveries = allDeliveries.filter((d) => d.channel === "WHATSAPP");

  const configMissing = !testEmail;

  return (
    <div className="space-y-6">
      {/* Config reminder */}
      {configMissing && (
        <div className="flex items-start gap-3 rounded-lg bg-yellow-400/5 border border-yellow-400/20 px-4 py-3">
          <i className="fa-solid fa-triangle-exclamation text-yellow-400 mt-0.5" />
          <div className="text-sm text-yellow-300">
            <span className="font-medium">Email de test non configuré.</span>{" "}
            <button
              type="button"
              onClick={onGoToConfig}
              className="underline hover:text-yellow-200"
            >
              Configurer les coordonnées →
            </button>
          </div>
        </div>
      )}

      {/* Current test config display */}
      {!configMissing && (
        <div className="flex items-center gap-4 rounded-lg bg-[#252628] border border-[#363636] px-4 py-3 w-fit">
          <span className="text-xs font-medium text-[#666] uppercase tracking-wider">
            Coordonnées de test
          </span>
          <span className="text-sm text-[#f9f9f9]">
            <i className="fa-solid fa-envelope text-[#7c6af7] mr-1.5" />
            {testEmail}
          </span>
          {testPhone && (
            <span className="text-sm text-[#f9f9f9]">
              <i className="fa-brands fa-whatsapp text-[#7c6af7] mr-1.5" />
              {testPhone}
            </span>
          )}
          <button
            type="button"
            onClick={onGoToConfig}
            className="text-xs text-[#7c6af7] hover:underline"
          >
            Modifier
          </button>
        </div>
      )}

      {/* Creation form */}
      <div className="max-w-lg space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#f9f9f9] mb-1">
            Test processus dossier
          </h2>
          <p className="text-sm text-[#b7b7b7]">
            Crée un dossier de test complet via le même processus que la production. Le client recevra les notifications réelles (email/WhatsApp) sur les coordonnées de test.
          </p>
        </div>

        {/* Product select */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#b7b7b7]">
            Produit <span className="text-red-400">*</span>
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] focus:outline-none focus:border-[#7c6af7]"
          >
            <option value="">
              {isLoadingProducts ? "Chargement…" : "Sélectionner un produit"}
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || configMissing || !selectedProductId}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7c6af7]/15 text-[#7c6af7] border border-[#7c6af7]/30 hover:bg-[#7c6af7]/25 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" />
              Création en cours…
            </>
          ) : (
            <>
              <i className="fa-solid fa-flask" />
              Créer un dossier de test
            </>
          )}
        </button>
      </div>

      {/* Observation view */}
      {createdDossierId && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#f9f9f9]">
              Vue d&apos;observation
            </h3>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoadingObs}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2d3033] text-[#b7b7b7] hover:text-[#f9f9f9] border border-[#363636] text-xs font-medium transition-colors disabled:opacity-50"
            >
              <i className={`fa-solid fa-rotate-right ${isLoadingObs ? "fa-spin" : ""}`} />
              Rafraîchir
            </button>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`/admin/dossiers/${createdDossierId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#50b989]/10 text-[#50b989] border border-[#50b989]/30 hover:bg-[#50b989]/20 transition-colors text-sm font-medium"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" />
              Ouvrir le dossier (admin)
            </a>
            {createdClientEmail && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#252628] text-[#b7b7b7] border border-[#363636] text-sm">
                <i className="fa-solid fa-user" />
                <span>
                  Côté client : connectez-vous avec{" "}
                  <strong className="text-[#f9f9f9]">{createdClientEmail}</strong>{" "}
                  puis ouvrez le dashboard client
                </span>
              </div>
            )}
          </div>

          {isLoadingObs ? (
            <div className="flex items-center gap-2 text-sm text-[#666]">
              <i className="fa-solid fa-spinner fa-spin" />
              Chargement des données…
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* État dossier */}
              <ObsCard title="État du dossier" icon="fa-folder">
                {dossierSummary ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#b7b7b7]">Statut actuel</span>
                      <StatusBadge status={dossierSummary.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#b7b7b7]">Produit</span>
                      <span className="text-xs text-[#f9f9f9]">
                        {dossierSummary.product?.name ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#b7b7b7]">Client</span>
                      <span className="text-xs text-[#f9f9f9]">
                        {dossierSummary.client?.full_name ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#b7b7b7]">Créé le</span>
                      <span className="text-xs text-[#f9f9f9]">
                        {formatDate(dossierSummary.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#b7b7b7]">ID</span>
                      <span className="text-xs text-[#666] font-mono">
                        {createdDossierId.slice(0, 8)}…
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#666]">Aucune donnée</p>
                )}
              </ObsCard>

              {/* Historique événements */}
              <ObsCard title={`Événements (${events.length})`} icon="fa-timeline">
                {events.length === 0 ? (
                  <p className="text-xs text-[#666]">Aucun événement</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {events.map((ev) => (
                      <li key={ev.id} className="flex items-start gap-2">
                        <i className="fa-solid fa-circle-dot text-[#7c6af7] text-xs mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-[#f9f9f9] font-medium truncate">
                            {ev.action}
                          </p>
                          <p className="text-xs text-[#666]">{formatDate(ev.created_at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ObsCard>

              {/* Notifications */}
              <ObsCard title={`Notifications (${notifications.length})`} icon="fa-bell">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#666]">Aucune notification</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.id} className="flex items-start gap-2">
                        <i className="fa-solid fa-bell text-[#7c6af7] text-xs mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-[#f9f9f9] font-medium truncate">
                            {n.title}
                          </p>
                          {n.template_code && (
                            <p className="text-xs text-[#666] font-mono">{n.template_code}</p>
                          )}
                          <p className="text-xs text-[#666]">{formatDate(n.created_at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ObsCard>

              {/* Emails envoyés */}
              <ObsCard title={`Emails envoyés (${emailDeliveries.length})`} icon="fa-envelope">
                {emailDeliveries.length === 0 ? (
                  <p className="text-xs text-[#666]">Aucun email envoyé</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {emailDeliveries.map((d) => (
                      <li key={d.id} className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-[#f9f9f9] truncate">{d.notifTitle}</span>
                          <StatusBadge status={d.status} />
                        </div>
                        <p className="text-xs text-[#666]">
                          {d.recipient} · {formatDate(d.sent_at ?? d.failed_at)}
                        </p>
                        {d.status === "FAILED" && d.provider_response && (
                          <p className="text-xs text-red-400 truncate">
                            {String(
                              (d.provider_response as Record<string, unknown>).message ??
                                JSON.stringify(d.provider_response)
                            )}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </ObsCard>

              {/* WhatsApp envoyés */}
              <ObsCard title={`WhatsApp envoyés (${whatsappDeliveries.length})`} icon="fa-comment-dots">
                {whatsappDeliveries.length === 0 ? (
                  <p className="text-xs text-[#666]">Aucun message WhatsApp envoyé</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {whatsappDeliveries.map((d) => (
                      <li key={d.id} className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-[#f9f9f9] truncate">{d.notifTitle}</span>
                          <StatusBadge status={d.status} />
                        </div>
                        <p className="text-xs text-[#666]">
                          {d.recipient} · {formatDate(d.sent_at ?? d.failed_at)}
                        </p>
                        {d.status === "FAILED" && d.provider_response && (
                          <p className="text-xs text-red-400 truncate">
                            {String(
                              (d.provider_response as Record<string, unknown>).message ??
                                JSON.stringify(d.provider_response)
                            )}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </ObsCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ObsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#1e1f22] border border-[#363636] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <i className={`fa-solid ${icon} text-[#7c6af7] text-xs`} />
        <h4 className="text-sm font-medium text-[#f9f9f9]">{title}</h4>
      </div>
      <div>{children}</div>
    </div>
  );
}
