"use client";

import { useState, useEffect, useMemo } from "react";

import type { ClientFilters } from "@/lib/clients";
import { useClients } from "@/lib/contexts/clients/ClientsContext";
import { ClientsFilters } from "./ClientsFilters";
import { ClientsTable } from "./ClientsTable";
import { ClientProfileSlideOver } from "./ClientProfileSlideOver";
import { CreateClientModal } from "./CreateClientModal";

export function AdminClientsContent() {
  const { clients, isLoading, error, fetchClients } = useClients();
  const [filters, setFilters] = useState<ClientFilters>({});
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const CLIENTS_PER_PAGE = 25;

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredClients = useMemo(() => {
    let filtered = [...clients];
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.full_name?.toLowerCase().includes(search) ||
          client.email.toLowerCase().includes(search) ||
          client.phone?.toLowerCase().includes(search)
      );
    }
    if (filters.status) {
      filtered = filtered.filter((client) => client.status === filters.status);
    }
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[filters.sortBy!];
        const bVal = b[filters.sortBy!];
        const order = filters.sortOrder === "asc" ? 1 : -1;
        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal) * order;
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * order;
        }
        return 0;
      });
    }
    return filtered;
  }, [clients, filters]);

  const totalPages = Math.ceil(filteredClients.length / CLIENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE;
  const paginatedClients = filteredClients.slice(
    startIndex,
    startIndex + CLIENTS_PER_PAGE
  );

  const handleRefresh = () => {
    fetchClients();
  };

  return (
    <div className="min-h-screen bg-[#191A1D] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-[#F9F9F9]">
              Gestion des Clients
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#50B88A] hover:bg-[#4ADE80] rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              Créer un client
            </button>
          </div>
          <p className="text-[#B7B7B7]">
            Vue d'ensemble de tous les clients de la plateforme
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <ClientsFilters
          filters={filters}
          onFiltersChange={setFilters}
          totalClients={filteredClients.length}
        />

        <ClientsTable
          clients={paginatedClients}
          isLoading={isLoading}
          onClientClick={setSelectedClientId}
          onRefresh={handleRefresh}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {selectedClientId && (
          <ClientProfileSlideOver
            clientId={selectedClientId}
            onClose={() => setSelectedClientId(null)}
            onStatusChanged={handleRefresh}
          />
        )}

        <CreateClientModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onClientCreated={handleRefresh}
        />
      </div>
    </div>
  );
}
