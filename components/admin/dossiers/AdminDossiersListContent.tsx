"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { DossierWithDetailsAndClient } from "@/types/dossiers";
import { AdminDossiersFilters } from "./AdminDossiersFilters";
import { AdminDossierCard } from "./AdminDossierCard";

interface AdminDossiersListContentProps {
  initialDossiers: DossierWithDetailsAndClient[];
}

export function AdminDossiersListContent({
  initialDossiers,
}: AdminDossiersListContentProps) {
  console.log(
    "🔍 [AdminDossiersListContent] Initializing with",
    initialDossiers.length,
    "dossiers"
  );
  console.log(
    "🔍 [AdminDossiersListContent] Sample dossier:",
    initialDossiers[0]
  );

  const [dossiers, setDossiers] = useState(initialDossiers);

  const handleTestFlagChange = useCallback(
    (dossierId: string, isTest: boolean) => {
      setDossiers((prev) =>
        prev.map((d) => (d.id === dossierId ? { ...d, is_test: isTest } : d))
      );
    },
    []
  );
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusFilter = searchParams.get("status") || "all";
  const searchTerm = searchParams.get("search") || "";
  const sortOption = searchParams.get("sort") || "recent";

  // Filter and sort dossiers
  const filteredDossiers = useMemo(() => {
    let filtered = [...dossiers];

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.user?.full_name?.toLowerCase().includes(term) ||
          d.user?.email?.toLowerCase().includes(term) ||
          d.id.toLowerCase().includes(term) ||
          d.product?.name?.toLowerCase().includes(term) ||
          JSON.stringify(d.metadata).toLowerCase().includes(term)
      );
    }

    // Apply sort
    switch (sortOption) {
      case "recent":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "progress_asc":
        filtered.sort(
          (a, b) => (a.progress_percentage || 0) - (b.progress_percentage || 0)
        );
        break;
      case "progress_desc":
        filtered.sort(
          (a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0)
        );
        break;
      case "status_az":
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return filtered;
  }, [dossiers, statusFilter, searchTerm, sortOption]);

  return (
    <div className="min-h-screen bg-[#191A1D] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#F9F9F9] mb-2">
            Dossiers LLC
          </h1>
          <p className="text-[#B7B7B7]">
            {filteredDossiers.length} dossier
            {filteredDossiers.length > 1 ? "s" : ""} dans le système
          </p>
        </div>

        {/* Filters */}
        <AdminDossiersFilters totalDossiers={filteredDossiers.length} />

        {/* Dossiers Grid */}
        {filteredDossiers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDossiers.map((dossier) => (
              <AdminDossierCard
                key={dossier.id}
                dossier={dossier}
                onTestFlagChange={handleTestFlagChange}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-[#2D3033] rounded-xl p-12 text-center">
      <div className="w-16 h-16 bg-[#363636] rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fa-solid fa-folder-tree text-2xl text-[#B7B7B7]"></i>
      </div>
      <h3 className="text-lg font-semibold text-[#F9F9F9] mb-2">
        Aucun dossier trouvé
      </h3>
      <p className="text-[#B7B7B7]">
        Aucun dossier ne correspond à vos critères de recherche.
      </p>
    </div>
  );
}
