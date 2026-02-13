"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useBackoffice } from "@/lib/contexts/backoffice/BackofficeContext";
import type { EntityType, EntityRow } from "@/lib/contexts/backoffice/types";

const ENTITY_TABS: { id: EntityType; label: string; icon: string }[] = [
  { id: "dossiers", label: "Dossiers", icon: "fa-folder-tree" },
  { id: "orders", label: "Commandes", icon: "fa-shopping-cart" },
  { id: "clients", label: "Clients", icon: "fa-users" },
  { id: "step-instances", label: "Step Instances", icon: "fa-list-check" },
  { id: "documents", label: "Documents", icon: "fa-file" },
];

const COLUMNS: Record<EntityType, string[]> = {
  dossiers: ["id", "status", "client_name", "product_name", "created_at"],
  orders: ["id", "status", "amount", "currency", "dossier_id", "created_at"],
  clients: ["id", "full_name", "status", "created_at"],
  "step-instances": ["id", "dossier_id", "step_name", "started_at", "completed_at"],
  documents: ["id", "dossier_id", "document_type_id", "status", "current_version_id", "created_at"],
};

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  status: "Statut",
  client_name: "Client",
  client_email: "Email",
  product_name: "Produit",
  created_at: "Créé le",
  amount: "Montant",
  currency: "Devise",
  dossier_id: "Dossier",
  full_name: "Nom",
  email: "Email",
  step_name: "Étape",
  started_at: "Démarré le",
  completed_at: "Terminé le",
  document_type_id: "Type doc.",
  current_version_id: "Version courante",
};

function formatCellValue(col: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (col === "created_at" || col === "started_at" || col === "completed_at") {
    try {
      return new Date(value as string).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(value);
    }
  }
  if (col === "amount") return `${value}`;
  if (col === "id" || col === "dossier_id" || col === "current_version_id") {
    const s = String(value);
    return s.length > 16 ? `${s.slice(0, 8)}…` : s;
  }
  return String(value);
}

function exportToCSV(columns: string[], rows: EntityRow[], entityType: EntityType) {
  const headers = columns.map((c) => COLUMN_LABELS[c] ?? c).join(",");
  const csvRows = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col];
        const formatted = formatCellValue(col, val);
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  const csv = [headers, ...csvRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${entityType}-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataExplorerTab() {
  const { fetchEntities } = useBackoffice();

  const [activeEntity, setActiveEntity] = useState<EntityType>("dossiers");
  const [rows, setRows] = useState<EntityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const PER_PAGE = 25;
  const totalPages = Math.ceil(total / PER_PAGE);
  const canExportCSV = ["dossiers", "orders", "documents"].includes(activeEntity);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchEntities(activeEntity, { page, search });
      setRows(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }, [activeEntity, page, search, fetchEntities]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEntityChange = (entity: EntityType) => {
    setActiveEntity(entity);
    setPage(1);
    setSearch("");
    setSearchInput("");
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const columns = COLUMNS[activeEntity];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#f9f9f9] mb-1">
          Explorer les données
        </h2>
        <p className="text-sm text-[#b7b7b7]">
          Consultation en lecture des entités métier. Édition limitée aux
          champs sûrs.
        </p>
      </div>

      {/* Entity sub-tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#252628] border border-[#363636] w-fit flex-wrap">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleEntityChange(tab.id)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeEntity === tab.id
                ? "bg-[#2d3033] text-[#f9f9f9] shadow-sm"
                : "text-[#b7b7b7] hover:text-[#f9f9f9] hover:bg-[#2d3033]/50"
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Export */}
      <div className="flex gap-3 items-center">
        <div className="flex gap-2 flex-1 max-w-sm">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Rechercher..."
            className="flex-1 bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:outline-none focus:border-[#50b989]"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-3 py-2 bg-[#2d3033] border border-[#363636] rounded-lg text-sm text-[#b7b7b7] hover:text-[#f9f9f9] transition-colors"
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>

        {canExportCSV && rows.length > 0 && (
          <button
            type="button"
            onClick={() => exportToCSV(columns, rows, activeEntity)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2d3033] border border-[#363636] text-sm text-[#b7b7b7] hover:text-[#f9f9f9] transition-colors"
          >
            <i className="fa-solid fa-file-csv" />
            Export CSV
          </button>
        )}

        <span className="text-xs text-[#666] ml-auto">
          {total} résultat{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="border border-[#363636] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#363636] bg-[#252628]">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-[#b7b7b7] uppercase tracking-wide whitespace-nowrap"
                  >
                    {COLUMN_LABELS[col] ?? col}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-[#b7b7b7] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#363636]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-[#666]"
                  >
                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                    Chargement…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-[#666]"
                  >
                    Aucun résultat
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={String(row["id"] ?? i)}
                    className="hover:bg-[#252628] transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-4 py-3 text-[#b7b7b7] whitespace-nowrap"
                      >
                        {col === "status" ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-[#2d3033] text-[#f9f9f9]">
                            {String(row[col] ?? "—")}
                          </span>
                        ) : (
                          <span className="font-mono text-xs">
                            {formatCellValue(col, row[col])}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <RowActions entity={activeEntity} row={row} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="px-3 py-1.5 rounded-lg bg-[#2d3033] border border-[#363636] text-sm text-[#b7b7b7] hover:text-[#f9f9f9] disabled:opacity-40 transition-colors"
          >
            <i className="fa-solid fa-chevron-left mr-1" />
            Précédent
          </button>
          <span className="text-sm text-[#666]">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            className="px-3 py-1.5 rounded-lg bg-[#2d3033] border border-[#363636] text-sm text-[#b7b7b7] hover:text-[#f9f9f9] disabled:opacity-40 transition-colors"
          >
            Suivant
            <i className="fa-solid fa-chevron-right ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}

function RowActions({
  entity,
  row,
}: {
  entity: EntityType;
  row: EntityRow;
}) {
  const id = String(row["id"] ?? "");
  const dossierId = String(row["dossier_id"] ?? "");

  if (entity === "dossiers") {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/dossiers/${id}`}
          className="text-xs text-[#50b989] hover:underline"
        >
          Voir
        </Link>
      </div>
    );
  }

  if (entity === "orders") {
    return (
      <div className="flex items-center gap-2">
        {dossierId && dossierId !== "—" && (
          <Link
            href={`/admin/dossiers/${dossierId}`}
            className="text-xs text-[#50b989] hover:underline"
          >
            Voir dossier
          </Link>
        )}
      </div>
    );
  }

  if (entity === "clients") {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/clients`}
          className="text-xs text-[#50b989] hover:underline"
        >
          Voir profil
        </Link>
      </div>
    );
  }

  if (entity === "step-instances") {
    return (
      <div className="flex items-center gap-2">
        {dossierId && dossierId !== "—" && (
          <Link
            href={`/admin/dossiers/${dossierId}`}
            className="text-xs text-[#50b989] hover:underline"
          >
            Voir dossier
          </Link>
        )}
      </div>
    );
  }

  if (entity === "documents") {
    return (
      <div className="flex items-center gap-2">
        {dossierId && dossierId !== "—" && (
          <Link
            href={`/admin/dossiers/${dossierId}`}
            className="text-xs text-[#50b989] hover:underline"
          >
            Voir dossier
          </Link>
        )}
      </div>
    );
  }

  return null;
}
