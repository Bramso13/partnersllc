"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ClientStatusModal } from "./ClientStatusModal";
import type { ClientProfile } from "@/lib/clients";

interface ClientProfileSlideOverProps {
  clientId: string;
  onClose: () => void;
  onStatusChanged: () => void;
}

export function ClientProfileSlideOver({
  clientId,
  onClose,
  onStatusChanged,
}: ClientProfileSlideOverProps) {
  const [client, setClient] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  useEffect(() => {
    async function fetchClientData() {
      setIsLoading(true);
      try {
        // Fetch client profile
        const clientRes = await fetch(`/api/admin/clients/${clientId}`);
        if (clientRes.ok) {
          const clientData = await clientRes.json();
          setClient(clientData);
        }

        // Fetch recent events
        const eventsRes = await fetch(`/api/admin/clients/${clientId}/events`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData);
        }

        // Fetch dossiers
        const dossiersRes = await fetch(
          `/api/admin/clients/${clientId}/dossiers`
        );
        if (dossiersRes.ok) {
          const dossiersData = await dossiersRes.json();
          setDossiers(dossiersData);
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClientData();
  }, [clientId]);

  const handleStatusChanged = () => {
    setStatusModalOpen(false);
    onStatusChanged();
    // Refresh client data
    setIsLoading(true);
    fetch(`/api/admin/clients/${clientId}`)
      .then((res) => res.json())
      .then((data) => setClient(data))
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
      ></div>

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#191A1D] z-50 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#2D3033] border-b border-[#363636] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#F9F9F9]">Profil Client</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#363636] rounded-lg transition-colors"
          >
            <i className="fa-solid fa-times text-[#B7B7B7]"></i>
          </button>
        </div>

        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton />
          </div>
        ) : client ? (
          <div className="p-6 space-y-6">
            {/* Client Info Card */}
            <div className="bg-[#2D3033] rounded-xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#50B88A] flex items-center justify-center text-white font-bold text-2xl">
                  {client.full_name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#F9F9F9] mb-1">
                    {client.full_name || "Sans nom"}
                  </h3>
                  <StatusBadge status={client.status} />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-[#B7B7B7] mb-1">Email</dt>
                  <dd className="text-sm text-[#F9F9F9]">{client.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#B7B7B7] mb-1">Téléphone</dt>
                  <dd className="text-sm text-[#F9F9F9]">
                    {client.phone || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#B7B7B7] mb-1">
                    Date de création
                  </dt>
                  <dd className="text-sm text-[#F9F9F9]">
                    {new Date(client.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#B7B7B7] mb-1">
                    Dernière mise à jour
                  </dt>
                  <dd className="text-sm text-[#F9F9F9]">
                    {new Date(client.updated_at).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
                {client.stripe_customer_id && (
                  <div className="col-span-2">
                    <dt className="text-xs text-[#B7B7B7] mb-1">
                      Stripe Customer ID
                    </dt>
                    <dd className="text-sm text-[#F9F9F9] font-mono">
                      {client.stripe_customer_id}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStatusModalOpen(true)}
                className="flex-1 px-4 py-3 bg-[#2D3033] border border-[#363636] rounded-lg text-[#F9F9F9] hover:border-[#50B88A] transition-colors font-medium"
              >
                <i className="fa-solid fa-edit mr-2"></i>
                Modifier le statut
              </button>
              <Link
                href={`/admin/dossiers?client_id=${clientId}`}
                className="flex-1 px-4 py-3 bg-[#50B88A] rounded-lg text-white hover:bg-[#4ADE80] transition-colors font-medium text-center"
              >
                <i className="fa-solid fa-folder-open mr-2"></i>
                Voir les dossiers
              </Link>
            </div>

            {/* Dossiers Summary */}
            <div className="bg-[#2D3033] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#F9F9F9] mb-4">
                Dossiers ({dossiers.length})
              </h3>
              {dossiers.length > 0 ? (
                <div className="space-y-3">
                  {dossiers.map((dossier) => (
                    <Link
                      key={dossier.id}
                      href={`/admin/dossiers/${dossier.id}`}
                      className="block p-3 bg-[#191A1D] border border-[#363636] rounded-lg hover:border-[#50B88A] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-[#F9F9F9]">
                            {dossier.product?.name || "Sans nom"}
                          </div>
                          <div className="text-xs text-[#B7B7B7] mt-1">
                            {new Date(dossier.created_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </div>
                        </div>
                        <DossierStatusBadge status={dossier.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#B7B7B7]">Aucun dossier.</p>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-[#2D3033] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#F9F9F9] mb-4">
                Activité récente
              </h3>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-[#191A1D] border border-[#363636] rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-[#F9F9F9]">
                            {event.description || event.event_type}
                          </div>
                          <div className="text-xs text-[#B7B7B7] mt-1">
                            {new Date(event.created_at).toLocaleString("fr-FR")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#B7B7B7]">Aucune activité.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-[#B7B7B7]">
            Client non trouvé
          </div>
        )}
      </div>

      {/* Status Modal */}
      {statusModalOpen && (
        <ClientStatusModal
          clientId={clientId}
          onClose={() => setStatusModalOpen(false)}
          onSuccess={handleStatusChanged}
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: {
      label: "En attente",
      color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    },
    ACTIVE: {
      label: "Actif",
      color: "bg-green-400/10 text-green-400 border-green-400/20",
    },
    SUSPENDED: {
      label: "Suspendu",
      color: "bg-red-400/10 text-red-400 border-red-400/20",
    },
  };

  const { label, color } = config[status as keyof typeof config] || config.PENDING;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}
    >
      {label}
    </span>
  );
}

function DossierStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Brouillon", color: "bg-gray-400/10 text-gray-400 border-gray-400/20" },
    IN_PROGRESS: { label: "En cours", color: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
    PENDING_REVIEW: { label: "En révision", color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
    COMPLETED: { label: "Terminé", color: "bg-green-400/10 text-green-400 border-green-400/20" },
    CANCELLED: { label: "Annulé", color: "bg-red-400/10 text-red-400 border-red-400/20" },
  };

  const { label, color } = config[status] || config.DRAFT;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}
    >
      {label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-[#2D3033] rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-[#363636] rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-[#363636] rounded w-1/3"></div>
            <div className="h-4 bg-[#363636] rounded w-1/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
