"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { HubSubscriptionRow } from "@/lib/admin/hub-subscriptions";
import { HubSubscriptionsFilters } from "./HubSubscriptionsFilters";
import { HubProfileModal } from "./HubProfileModal";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";

const PAGE_SIZE = 50;

export function AdminHubSubscriptionsContent() {
  const [rows, setRows] = useState<HubSubscriptionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{
    status?: string;
    plan?: string;
    is_llc_client?: boolean;
  }>({});
  const [profileModalRow, setProfileModalRow] = useState<HubSubscriptionRow | null>(null);
  const [cancelModalRow, setCancelModalRow] = useState<HubSubscriptionRow | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/hub/subscriptions");
        if (res.ok) {
          const data = await res.json();
          setRows(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    let list = [...rows];
    if (filters.status) list = list.filter((r) => r.status === filters.status);
    if (filters.plan) list = list.filter((r) => r.plan === filters.plan);
    if (filters.is_llc_client === true) list = list.filter((r) => r.is_llc_client);
    return list;
  }, [rows, filters]);

  const columnHelper = createColumnHelper<HubSubscriptionRow>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("display_name", {
        header: "Membre",
        cell: (c) => c.getValue() || "-",
      }),
      columnHelper.accessor("email", { header: "Email" }),
      columnHelper.accessor("plan", {
        header: "Plan",
        cell: (c) => (c.getValue() === "yearly" ? "Annuel" : "Mensuel"),
      }),
      columnHelper.accessor("status", {
        header: "Statut",
        cell: (c) => <StatusBadge status={c.getValue()} />,
      }),
      columnHelper.accessor("started_at", {
        header: "Date inscription",
        cell: (c) =>
          new Date(c.getValue()).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
      }),
      columnHelper.accessor("country", {
        header: "Pays",
        cell: (c) => c.getValue() ?? "-",
      }),
      columnHelper.accessor("profession", {
        header: "Métier",
        cell: (c) => c.getValue() ?? "-",
      }),
      columnHelper.accessor("is_llc_client", {
        header: "Client LLC?",
        cell: (c) => (
          <span
            className={
              c.getValue()
                ? "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20"
                : "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#363636] text-[#B7B7B7] border border-[#363636]"
            }
          >
            {c.getValue() ? "Oui" : "Non"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProfileModalRow(row.original);
              }}
              className="text-sm text-[#50B88A] hover:text-[#4ADE80] transition-colors"
            >
              Voir profil
            </button>
            {row.original.status === "active" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCancelModalRow(row.original);
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Annuler abonnement
              </button>
            )}
          </div>
        ),
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const handleExportCsv = () => {
    const headers = [
      "Membre",
      "Email",
      "Plan",
      "Statut",
      "Date inscription",
      "Pays",
      "Métier",
      "Client LLC",
    ];
    const planLabel = (p: string) => (p === "yearly" ? "Annuel" : "Mensuel");
    const lines = filteredRows.map((r) =>
      [
        r.display_name ?? "",
        r.email,
        planLabel(r.plan),
        r.status,
        new Date(r.started_at).toLocaleDateString("fr-FR"),
        r.country ?? "",
        r.profession ?? "",
        r.is_llc_client ? "Oui" : "Non",
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")
    );
    const csv = "\uFEFF" + [headers.join(";"), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscriptions-hub-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCancelSuccess = (subscriptionId: string) => {
    setCancelModalRow(null);
    setRows((prev) =>
      prev.map((r) =>
        r.id === subscriptionId ? { ...r, status: "cancelled" as const } : r
      )
    );
  };

  if (isLoading) {
    return (
      <div className="bg-[#2D3033] rounded-xl p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-[#363636] rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#363636] rounded w-1/4" />
                <div className="h-3 bg-[#363636] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#F9F9F9]">
          Inscriptions Partners Hub
        </h1>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#50B88A] hover:bg-[#45a078] text-white rounded-lg font-medium transition-colors"
        >
          <i className="fa-solid fa-file-export" />
          Exporter
        </button>
      </div>

      <HubSubscriptionsFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={filteredRows.length}
      />

      <div className="bg-[#2D3033] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#191A1D] border-b border-[#363636]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-[#B7B7B7] uppercase tracking-wider whitespace-nowrap"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#363636]">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-[#B7B7B7]"
                  >
                    Aucune inscription Hub trouvée.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#363636] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-[#F9F9F9]"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#363636]">
            <span className="text-sm text-[#B7B7B7]">
              Page {table.getState().pagination.pageIndex + 1} sur{" "}
              {table.getPageCount()} ({filteredRows.length} résultat
              {filteredRows.length !== 1 ? "s" : ""})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1.5 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] hover:border-[#50B88A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1.5 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] hover:border-[#50B88A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {profileModalRow && (
        <HubProfileModal
          row={profileModalRow}
          onClose={() => setProfileModalRow(null)}
        />
      )}
      {cancelModalRow && (
        <CancelSubscriptionModal
          row={cancelModalRow}
          onClose={() => setCancelModalRow(null)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; color: string }
  > = {
    active: {
      label: "Actif",
      color: "bg-green-400/10 text-green-400 border-green-400/20",
    },
    cancelled: {
      label: "Annulé",
      color: "bg-red-400/10 text-red-400 border-red-400/20",
    },
    expired: {
      label: "Expiré",
      color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    },
    suspended: {
      label: "Suspendu",
      color: "bg-[#363636] text-[#B7B7B7] border-[#363636]",
    },
  };
  const { label, color } = config[status] ?? {
    label: status,
    color: "bg-[#363636] text-[#B7B7B7] border-[#363636]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}
    >
      {label}
    </span>
  );
}
