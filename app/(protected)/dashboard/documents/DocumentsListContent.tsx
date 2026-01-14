"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { DocumentWithDetails } from "@/lib/documents-types";
import { getDocumentCategory } from "@/lib/documents-types";
import { DocumentsEmptyState } from "@/components/documents/DocumentsEmptyState";
import { DocumentsLoadingSkeleton } from "@/components/documents/DocumentsLoadingSkeleton";
import { CategoryTabs } from "@/components/documents/CategoryTabs";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { UploadDocumentModal } from "@/components/documents/UploadDocumentModal";
import { Pagination } from "@/components/dossiers/Pagination";
import { SearchInput } from "@/components/dossiers/SearchInput";

interface DocumentsListContentProps {
  initialDocuments: DocumentWithDetails[];
}

const ITEMS_PER_PAGE = 20;

type DocumentCategory = "all" | "juridique" | "fiscal" | "bancaire" | "archives";
type ViewMode = "list" | "grid";
type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc" | "status_asc" | "status_desc";

export function DocumentsListContent({
  initialDocuments,
}: DocumentsListContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get values directly from URL params
  const category = (searchParams.get("category") || "all") as DocumentCategory;
  const search = searchParams.get("search") || "";
  const view = (searchParams.get("view") || "list") as ViewMode;
  const sort = (searchParams.get("sort") || "date_desc") as SortOption;
  const currentPage = parseInt(searchParams.get("page") || "1");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Update URL when filters change
  const updateURL = (
    newCategory: DocumentCategory,
    newSearch: string,
    newView: ViewMode,
    newSort: SortOption,
    newPage: number
  ) => {
    const params = new URLSearchParams();
    if (newCategory !== "all") params.set("category", newCategory);
    if (newSearch) params.set("search", newSearch);
    if (newView !== "list") params.set("view", newView);
    if (newSort !== "date_desc") params.set("sort", newSort);
    if (newPage > 1) params.set("page", newPage.toString());

    const queryString = params.toString();
    router.replace(
      queryString ? `/dashboard/documents?${queryString}` : "/dashboard/documents",
      { scroll: false }
    );
  };

  // Filter documents by category
  const filteredByCategory = useMemo(() => {
    if (category === "all") return initialDocuments;

    if (category === "archives") {
      // Archived = documents with OUTDATED status
      return initialDocuments.filter(
        (doc) => doc.status === "OUTDATED"
      );
    }

    return initialDocuments.filter((doc) => {
      const docCategory = getDocumentCategory(doc.document_type);
      return docCategory === category;
    });
  }, [initialDocuments, category]);

  // Filter documents by search
  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return filteredByCategory;

    const searchLower = search.toLowerCase();
    return filteredByCategory.filter((doc) => {
      const fileName = doc.current_version?.file_name?.toLowerCase() || "";
      const docTypeLabel = doc.document_type?.label?.toLowerCase() || "";
      const dossierName = doc.dossier?.product?.name?.toLowerCase() || "";

      return (
        fileName.includes(searchLower) ||
        docTypeLabel.includes(searchLower) ||
        dossierName.includes(searchLower)
      );
    });
  }, [filteredByCategory, search]);

  // Sort documents
  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredBySearch];

    switch (sort) {
      case "date_desc":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      case "date_asc":
        return sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
      case "name_asc":
        return sorted.sort((a, b) =>
          (a.current_version?.file_name || "").localeCompare(
            b.current_version?.file_name || ""
          )
        );
      case "name_desc":
        return sorted.sort((a, b) =>
          (b.current_version?.file_name || "").localeCompare(
            a.current_version?.file_name || ""
          )
        );
      case "status_asc":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      case "status_desc":
        return sorted.sort((a, b) => b.status.localeCompare(a.status));
      default:
        return sorted;
    }
  }, [filteredBySearch, sort]);

  // Paginate documents
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedDocuments.slice(start, end);
  }, [sortedDocuments, currentPage]);

  const totalPages = Math.ceil(sortedDocuments.length / ITEMS_PER_PAGE);

  // Handle category change
  const handleCategoryChange = (newCategory: DocumentCategory) => {
    setIsLoading(true);
    updateURL(newCategory, search, view, sort, 1);
    setTimeout(() => setIsLoading(false), 100);
  };

  // Handle search change
  const handleSearchChange = (newSearch: string) => {
    setIsLoading(true);
    updateURL(category, newSearch, view, sort, 1);
    setTimeout(() => setIsLoading(false), 100);
  };

  // Handle view change
  const handleViewChange = (newView: ViewMode) => {
    updateURL(category, search, newView, sort, currentPage);
  };

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    setIsLoading(true);
    updateURL(category, search, view, newSort, 1);
    setTimeout(() => setIsLoading(false), 100);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    updateURL(category, search, view, sort, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setIsLoading(false), 100);
  };

  if (isLoading) {
    return (
      <>
        <DocumentsPageHeader onUploadClick={() => setIsUploadModalOpen(true)} />
        <DocumentsLoadingSkeleton />
      </>
    );
  }

  return (
    <>
      {/* Page Header */}
      <DocumentsPageHeader onUploadClick={() => setIsUploadModalOpen(true)} />

      {/* Search Bar */}
      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Rechercher dans vos documents..."
          debounceMs={300}
        />
      </div>

      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <CategoryTabs
            selectedCategory={category}
            onCategoryChange={handleCategoryChange}
          />
          {/* View toggle will be added here later */}
        </div>
      </div>

      {/* Documents List */}
      {sortedDocuments.length === 0 ? (
        <DocumentsEmptyState />
      ) : (
        <>
          <DocumentsTable
            documents={paginatedDocuments}
            sort={sort}
            onSortChange={handleSortChange}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadDocumentModal
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            setIsUploadModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function DocumentsPageHeader({
  onUploadClick,
}: {
  onUploadClick: () => void;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-text-primary">
            Vos Documents
          </h1>
          <p className="text-brand-text-secondary mt-1">
            Gérez et accédez à tous vos documents légaux et administratifs.
          </p>
        </div>
        <button
          onClick={onUploadClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-dark-bg rounded-lg hover:opacity-90 transition-opacity font-medium text-sm min-h-[44px]"
        >
          <i className="fa-solid fa-upload"></i>
          <span>Téléverser un document</span>
        </button>
      </div>
    </div>
  );
}
