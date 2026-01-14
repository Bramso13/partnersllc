"use client";

import { useState, useEffect } from "react";

import type { ClientWithDossierCount, ClientFilters } from "@/lib/clients";
import { ClientsFilters } from "./ClientsFilters";
import { ClientsTable } from "./ClientsTable";
import { ClientProfileSlideOver } from "./ClientProfileSlideOver";

export function AdminClientsContent() {
  const [clients, setClients] = useState<ClientWithDossierCount[]>([]);
  const [filteredClients, setFilteredClients] = useState<
    ClientWithDossierCount[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ClientFilters>({});
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const CLIENTS_PER_PAGE = 25;

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      console.log("🔍 [AdminClientsContent] Fetching clients...");
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/clients");
        console.log(
          "✅ [AdminClientsContent] Response status:",
          response.status
        );

        if (response.ok) {
          const data = await response.json();
          console.log(
            "✅ [AdminClientsContent] Data received:",
            data.length,
            "clients"
          );
          console.log("🔍 [AdminClientsContent] Sample client:", data[0]);
          setClients(data);
          setFilteredClients(data);
        } else {
          const error = await response.json();
          console.error("❌ [AdminClientsContent] Error response:", error);
        }
      } catch (error) {
        console.error("❌ [AdminClientsContent] Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClients();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...clients];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.full_name?.toLowerCase().includes(search) ||
          client.email.toLowerCase().includes(search) ||
          client.phone?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((client) => client.status === filters.status);
    }

    // Sorting
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

    setFilteredClients(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, clients]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / CLIENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE;
  const paginatedClients = filteredClients.slice(
    startIndex,
    startIndex + CLIENTS_PER_PAGE
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error refreshing clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#191A1D] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#F9F9F9] mb-2">
            Gestion des Clients
          </h1>
          <p className="text-[#B7B7B7]">
            Vue d'ensemble de tous les clients de la plateforme
          </p>
        </div>

        {/* Filters */}
        <ClientsFilters
          filters={filters}
          onFiltersChange={setFilters}
          totalClients={filteredClients.length}
        />

        {/* Table */}
        <ClientsTable
          clients={paginatedClients}
          isLoading={isLoading}
          onClientClick={setSelectedClientId}
          onRefresh={handleRefresh}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Slide-over */}
        {selectedClientId && (
          <ClientProfileSlideOver
            clientId={selectedClientId}
            onClose={() => setSelectedClientId(null)}
            onStatusChanged={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}
