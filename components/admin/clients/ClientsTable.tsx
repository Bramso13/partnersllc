"use client";

import { useState } from "react";
import Link from "next/link";
import type { ClientWithDossierCount } from "@/lib/clients";
import { ClientStatusModal } from "./ClientStatusModal";

interface ClientsTableProps {
  clients: ClientWithDossierCount[];
  isLoading: boolean;
  onClientClick: (clientId: string) => void;
  onRefresh: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ClientsTable({
  clients,
  isLoading,
  onClientClick,
  onRefresh,
  currentPage,
  totalPages,
  onPageChange,
}: ClientsTableProps) {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleStatusChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setStatusModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleStatusChanged = () => {
    setStatusModalOpen(false);
    onRefresh();
  };

  const toggleDropdown = (clientId: string) => {
    setOpenDropdownId(openDropdownId === clientId ? null : clientId);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (clients.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="bg-[#2D3033] rounded-xl overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#191A1D] border-b border-[#363636]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7B7B7] uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7B7B7] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7B7B7] uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7B7B7] uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7B7B7] uppercase tracking-wider">
                  Dossiers
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7B7B7] uppercase tracking-wider">
                  Date création
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#B7B7B7] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#363636]">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-[#363636] transition-colors cursor-pointer"
                  onClick={() => onClientClick(client.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#50B88A] flex items-center justify-center text-white font-semibold mr-3">
                        {client.full_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#F9F9F9]">
                          {client.full_name || "Sans nom"}
                        </div>
                        <div className="text-xs text-[#B7B7B7]">
                          ID: {client.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#F9F9F9]">{client.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#F9F9F9]">
                      {client.phone || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/dossiers?client_id=${client.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-sm text-[#50B88A] hover:text-[#4ADE80] transition-colors"
                    >
                      <i className="fa-solid fa-folder-open"></i>
                      <span className="font-semibold">
                        {client.dossiers_count}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#B7B7B7]">
                      {new Date(client.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(client.id);
                      }}
                      className="p-2 hover:bg-[#191A1D] rounded-lg transition-colors"
                    >
                      <i className="fa-solid fa-ellipsis-vertical text-[#B7B7B7]"></i>
                    </button>

                    {openDropdownId === client.id && (
                      <div
                        className="absolute right-0 mt-2 w-56 bg-[#191A1D] border border-[#363636] rounded-lg shadow-xl z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onClientClick(client.id)}
                          className="w-full px-4 py-3 text-left text-sm text-[#F9F9F9] hover:bg-[#2D3033] transition-colors flex items-center gap-3"
                        >
                          <i className="fa-solid fa-user w-4"></i>
                          Voir le profil
                        </button>
                        <Link
                          href={`/admin/dossiers?client_id=${client.id}`}
                          className="block w-full px-4 py-3 text-left text-sm text-[#F9F9F9] hover:bg-[#2D3033] transition-colors"
                        >
                          <i className="fa-solid fa-folder-open w-4 mr-3"></i>
                          Voir les dossiers
                        </Link>
                        <button
                          onClick={() => handleStatusChange(client.id)}
                          className="w-full px-4 py-3 text-left text-sm text-[#F9F9F9] hover:bg-[#2D3033] transition-colors flex items-center gap-3"
                        >
                          <i className="fa-solid fa-edit w-4"></i>
                          Modifier le statut
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#363636]">
            <div className="text-sm text-[#B7B7B7]">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] hover:border-[#50B88A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] hover:border-[#50B88A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Modal */}
      {statusModalOpen && selectedClientId && (
        <ClientStatusModal
          clientId={selectedClientId}
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

function LoadingSkeleton() {
  return (
    <div className="bg-[#2D3033] rounded-xl p-6">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-[#363636] rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#363636] rounded w-1/4"></div>
              <div className="h-3 bg-[#363636] rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-[#2D3033] rounded-xl p-12 text-center">
      <div className="w-16 h-16 bg-[#363636] rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fa-solid fa-users text-2xl text-[#B7B7B7]"></i>
      </div>
      <h3 className="text-lg font-semibold text-[#F9F9F9] mb-2">
        Aucun client enregistré
      </h3>
      <p className="text-[#B7B7B7]">
        Les clients apparaîtront ici une fois qu'ils se seront inscrits.
      </p>
    </div>
  );
}
