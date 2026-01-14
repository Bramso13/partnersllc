"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/products";
import { formatPrice } from "@/lib/products-client";
import { format } from "date-fns";
import { EditProductModal } from "./EditProductModal";
import { DeleteProductButton } from "./DeleteProductButton";

interface ProductsTableProps {
  products: Product[];
  onProductDeleted: () => void;
  onProductUpdated: () => void;
}

type SortField = "name" | "dossier_type" | "price_amount" | "created_at";
type SortDirection = "asc" | "desc";

export function ProductsTable({
  products,
  onProductDeleted,
  onProductUpdated,
}: ProductsTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-500 ml-1">⇅</span>;
    }
    return (
      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
    );
  };

  if (products.length === 0) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-lg p-8 text-center">
        <p className="text-brand-text-secondary mb-4">
          No products found. Create your first product to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-brand-card border border-brand-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-dark-bg/50 border-b border-brand-border">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-text-primary"
                  onClick={() => handleSort("name")}
                >
                  Product Name
                  <SortIcon field="name" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-text-primary"
                  onClick={() => handleSort("dossier_type")}
                >
                  Type
                  <SortIcon field="dossier_type" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-text-primary"
                  onClick={() => handleSort("price_amount")}
                >
                  Price
                  <SortIcon field="price_amount" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                  Active Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-text-primary"
                  onClick={() => handleSort("created_at")}
                >
                  Created Date
                  <SortIcon field="created_at" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-brand-dark-bg/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-brand-text-primary">
                      {product.name}
                    </div>
                    {product.description && (
                      <div className="text-sm text-brand-text-secondary truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-brand-accent/10 text-brand-accent">
                      {product.dossier_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-primary font-medium">
                    {formatPrice(product.price_amount, product.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.active
                          ? "bg-green-500/10 text-green-400"
                          : "bg-gray-500/10 text-gray-400"
                      }`}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                    {format(new Date(product.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/products/${product.id}/workflow`)}
                        className="text-brand-accent hover:text-brand-accent/80 font-medium"
                      >
                        Workflow
                      </button>
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-brand-text-secondary hover:text-brand-text-primary font-medium"
                      >
                        Edit
                      </button>
                      <DeleteProductButton
                        product={product}
                        onDeleted={onProductDeleted}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between">
            <div className="text-sm text-brand-text-secondary">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, products.length)} of{" "}
              {products.length} products
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-brand-border text-brand-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-dark-bg/50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page
                          ? "bg-brand-accent text-white"
                          : "border border-brand-border text-brand-text-primary hover:bg-brand-dark-bg/50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-brand-border text-brand-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-dark-bg/50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setEditingProduct(null);
            onProductUpdated();
          }}
        />
      )}
    </>
  );
}
