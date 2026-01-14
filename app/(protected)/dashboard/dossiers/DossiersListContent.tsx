"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DossierWithDetails, DossierStatus } from "@/lib/dossiers";
import { DossierCard } from "@/components/dossiers/DossierCard";
import { StatusFilter } from "@/components/dossiers/StatusFilter";
import { SearchInput } from "@/components/dossiers/SearchInput";
import { SortDropdown } from "@/components/dossiers/SortDropdown";
import { Pagination } from "@/components/dossiers/Pagination";
import { DossiersEmptyState } from "@/components/dossiers/DossiersEmptyState";
import { DossiersLoadingSkeleton } from "@/components/dossiers/DossiersLoadingSkeleton";

interface DossiersListContentProps {
  initialDossiers: DossierWithDetails[];
}

const ITEMS_PER_PAGE = 12;

export function DossiersListContent({
  initialDossiers,
}: DossiersListContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get values directly from URL params (single source of truth)
  const status = searchParams.get("status") || "all";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "date_desc";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const [isLoading, setIsLoading] = useState(false);

  // Update URL when filters change (using replace to avoid history entries)
  const updateURL = (
    newStatus: string,
    newSearch: string,
    newSort: string,
    newPage: number
  ) => {
    const params = new URLSearchParams();
    if (newStatus !== "all") params.set("status", newStatus);
    if (newSearch) params.set("search", newSearch);
    if (newSort !== "date_desc") params.set("sort", newSort);
    if (newPage > 1) params.set("page", newPage.toString());

    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : "/dashboard/dossiers", {
      scroll: false,
    });
  };

  // Filter dossiers by status
  const filteredByStatus = useMemo(() => {
    if (status === "all") return initialDossiers;
    return initialDossiers.filter(
      (dossier) => dossier.status === (status as DossierStatus)
    );
  }, [initialDossiers, status]);

  // Filter dossiers by search
  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return filteredByStatus;

    const searchLower = search.toLowerCase();
    return filteredByStatus.filter((dossier) => {
      const productName = dossier.product?.name?.toLowerCase() || "";
      const dossierId = dossier.id.toLowerCase();
      const llcName = (dossier.metadata?.llc_name || "").toLowerCase();

      return (
        productName.includes(searchLower) ||
        dossierId.includes(searchLower) ||
        llcName.includes(searchLower)
      );
    });
  }, [filteredByStatus, search]);

  // Sort dossiers
  const sortedDossiers = useMemo(() => {
    const sorted = [...filteredBySearch];

    switch (sort) {
      case "date_desc":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "date_asc":
        return sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "name_asc":
        return sorted.sort((a, b) =>
          (a.product?.name || "").localeCompare(b.product?.name || "")
        );
      case "name_desc":
        return sorted.sort((a, b) =>
          (b.product?.name || "").localeCompare(a.product?.name || "")
        );
      case "progress_asc":
        return sorted.sort(
          (a, b) => (a.progress_percentage || 0) - (b.progress_percentage || 0)
        );
      case "progress_desc":
        return sorted.sort(
          (a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0)
        );
      default:
        return sorted;
    }
  }, [filteredBySearch, sort]);

  // Paginate dossiers
  const paginatedDossiers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedDossiers.slice(start, end);
  }, [sortedDossiers, currentPage]);

  const totalPages = Math.ceil(sortedDossiers.length / ITEMS_PER_PAGE);

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setIsLoading(true);
    updateURL(newStatus, search, sort, 1);
    setTimeout(() => setIsLoading(false), 100);
  };

  // Handle search change
  const handleSearchChange = (newSearch: string) => {
    setIsLoading(true);
    updateURL(status, newSearch, sort, 1);
    setTimeout(() => setIsLoading(false), 100);
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    setIsLoading(true);
    updateURL(status, search, newSort, 1);
    setTimeout(() => setIsLoading(false), 100);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    updateURL(status, search, sort, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setIsLoading(false), 100);
  };

  // Get count text for filtered results
  const getCountText = () => {
    const count = sortedDossiers.length;
    if (count === 0) return "Aucun dossier";
    if (count === 1) return "1 dossier";
    return `${count} dossiers`;
  };

  // Get status label for display
  const getStatusLabel = (statusCode: string): string => {
    const statusMap: Record<string, string> = {
      all: "Tous les statuts",
      QUALIFICATION: "Qualification",
      FORM_SUBMITTED: "Formulaire soumis",
      NM_PENDING: "En attente NM",
      LLC_ACCEPTED: "LLC acceptée",
      EIN_PENDING: "En attente EIN",
      BANK_PREPARATION: "Préparation bancaire",
      BANK_OPENED: "Compte ouvert",
      WAITING_48H: "Attente 48h",
      CLOSED: "Fermé",
      ERROR: "Erreur",
    };
    return statusMap[statusCode] || statusCode;
  };

  if (isLoading) {
    return (
      <>
        <DossiersPageHeader totalCount={sortedDossiers.length} />
        <DossiersLoadingSkeleton />
      </>
    );
  }

  return (
    <>
      {/* Page Header */}
      <DossiersPageHeader totalCount={sortedDossiers.length} />

      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <StatusFilter
            selectedStatus={status}
            onStatusChange={handleStatusChange}
          />
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Rechercher par nom de produit ou numéro de dossier..."
            debounceMs={300}
          />
          <SortDropdown value={sort} onChange={handleSortChange} />
        </div>
      </div>

      {/* Results Count */}
      {sortedDossiers.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-brand-text-secondary">
            {getCountText()}
            {status !== "all" && (
              <span className="ml-2">
                avec le statut &quot;{getStatusLabel(status)}&quot;
              </span>
            )}
          </p>
        </div>
      )}

      {/* Dossiers Grid */}
      {sortedDossiers.length === 0 ? (
        <DossiersEmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDossiers.map((dossier) => (
              <DossierCard key={dossier.id} dossier={dossier} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </>
  );
}

function DossiersPageHeader({ totalCount }: { totalCount: number }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-brand-text-primary">
            Mes dossiers
          </h1>
          <p className="text-brand-text-secondary mt-1">
            Gérez tous vos dossiers de services d&apos;affaires
          </p>
        </div>
        <div className="flex items-center gap-4">
          {totalCount > 0 && (
            <div className="bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-full text-sm font-medium border border-brand-accent/20">
              {totalCount} {totalCount === 1 ? "dossier" : "dossiers"}
            </div>
          )}
          <a
            href="/dashboard/support"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-dark-bg rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
          >
            <span>Nouveau dossier</span>
            <i className="fa-solid fa-plus"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
