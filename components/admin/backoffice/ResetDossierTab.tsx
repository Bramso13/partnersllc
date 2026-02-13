"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useBackoffice } from "@/lib/contexts/backoffice/BackofficeContext";
import type { EntityRow } from "@/lib/contexts/backoffice/types";

type DossierRow = {
  id: string;
  status: string;
  client_name: string;
  product_name: string;
  created_at: string;
};

type DossierSummary = {
  id: string;
  status: string;
  client_name: string;
  product_name: string;
  step_instances_count: number;
  documents_count: number;
};

export function ResetDossierTab() {
  const { fetchEntities, getDossierSummary, resetDossier } = useBackoffice();

  const [allDossiers, setAllDossiers] = useState<DossierRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedDossier, setSelectedDossier] = useState<DossierSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [resetReason, setResetReason] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchEntities("dossiers", { page: 1 })
      .then((res) => setAllDossiers(res.data as DossierRow[]))
      .catch(() => toast.error("Erreur de chargement des dossiers"))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!filter.trim()) return allDossiers;
    const q = filter.toLowerCase();
    return allDossiers.filter(
      (d) =>
        d.client_name?.toLowerCase().includes(q) ||
        d.product_name?.toLowerCase().includes(q) ||
        d.status?.toLowerCase().includes(q) ||
        d.id?.toLowerCase().startsWith(q)
    );
  }, [allDossiers, filter]);

  const handleSelect = useCallback(
    async (row: DossierRow) => {
      setIsLoadingSummary(true);
      try {
        const summary = await getDossierSummary(row.id);
        setSelectedDossier(
          summary
            ? {
                id: summary.id,
                status: summary.status,
                client_name: (summary.client as { full_name?: string } | null)?.full_name ?? row.client_name,
                product_name: (summary.product as { name?: string } | null)?.name ?? row.product_name,
                step_instances_count: summary.step_instances_count ?? 0,
                documents_count: summary.documents_count ?? 0,
              }
            : {
                id: row.id,
                status: row.status,
                client_name: row.client_name,
                product_name: row.product_name,
                step_instances_count: 0,
                documents_count: 0,
              }
        );
      } finally {
        setIsLoadingSummary(false);
      }
    },
    [getDossierSummary]
  );

  const handleConfirmReset = useCallback(async () => {
    if (!selectedDossier) return;
    if (!resetReason.trim()) {
      toast.error("La raison est obligatoire");
      return;
    }
    setIsResetting(true);
    try {
      await resetDossier(selectedDossier.id, { reason: resetReason.trim() });
      toast.success("Dossier réinitialisé avec succès");
      setShowModal(false);
      setSelectedDossier(null);
      setResetReason("");
      // Refresh list
      const res = await fetchEntities("dossiers", { page: 1 });
      setAllDossiers(res.data as DossierRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du reset");
    } finally {
      setIsResetting(false);
    }
  }, [selectedDossier, resetReason, resetDossier, fetchEntities]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#f9f9f9] mb-1">
          Reset dossier
        </h2>
        <p className="text-sm text-[#b7b7b7]">
          Sélectionnez un dossier à réinitialiser au statut QUALIFICATION.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste dossiers */}
        <div className="space-y-3">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par client, produit, statut ou ID..."
            className="w-full bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:outline-none focus:border-[#50b989]"
          />

          <div className="border border-[#363636] rounded-xl bg-[#1e1f22] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#363636] flex items-center justify-between">
              <span className="text-xs text-[#666]">
                {isLoading ? "Chargement…" : `${filtered.length} dossier${filtered.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-[#363636]">
              {isLoading ? (
                <div className="px-4 py-6 text-center text-[#666] text-sm">
                  <i className="fa-solid fa-spinner fa-spin mr-2" />
                  Chargement…
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-[#666] text-sm">
                  Aucun dossier trouvé
                </div>
              ) : (
                filtered.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelect(d)}
                    disabled={isLoadingSummary}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#2d3033] ${
                      selectedDossier?.id === d.id
                        ? "bg-[#50b989]/10 border-l-2 border-[#50b989]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#f9f9f9] truncate">
                          {d.client_name ?? "—"}
                        </p>
                        <p className="text-xs text-[#b7b7b7] truncate">
                          {d.product_name ?? "—"} ·{" "}
                          <code className="font-mono">{d.id.slice(0, 8)}…</code>
                        </p>
                      </div>
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-[#363636] text-[#b7b7b7]">
                        {d.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Résumé + action */}
        <div>
          {!selectedDossier ? (
            <div className="border border-[#363636] rounded-xl bg-[#1e1f22] p-8 flex items-center justify-center h-full min-h-[200px]">
              <p className="text-sm text-[#666] text-center">
                {isLoadingSummary ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2" />Chargement…</>
                ) : (
                  "Sélectionnez un dossier pour voir son résumé"
                )}
              </p>
            </div>
          ) : (
            <div className="border border-[#363636] rounded-xl bg-[#1e1f22] p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#f9f9f9]">
                Résumé du dossier
              </h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#666] text-xs mb-0.5">Client</p>
                  <p className="text-[#f9f9f9]">{selectedDossier.client_name}</p>
                </div>
                <div>
                  <p className="text-[#666] text-xs mb-0.5">Produit</p>
                  <p className="text-[#f9f9f9]">{selectedDossier.product_name}</p>
                </div>
                <div>
                  <p className="text-[#666] text-xs mb-0.5">Statut actuel</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs">
                    {selectedDossier.status}
                  </span>
                </div>
                <div>
                  <p className="text-[#666] text-xs mb-0.5">ID</p>
                  <code className="text-xs font-mono text-[#b7b7b7]">
                    {selectedDossier.id.slice(0, 16)}…
                  </code>
                </div>
                <div>
                  <p className="text-[#666] text-xs mb-0.5">Step instances</p>
                  <p className="text-[#f9f9f9]">{selectedDossier.step_instances_count}</p>
                </div>
                <div>
                  <p className="text-[#666] text-xs mb-0.5">Documents</p>
                  <p className="text-[#f9f9f9]">{selectedDossier.documents_count}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setResetReason(""); setShowModal(true); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors text-sm font-medium"
              >
                <i className="fa-solid fa-rotate-left" />
                Reset ce dossier
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmation */}
      {showModal && selectedDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e1f22] border border-[#363636] rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                <i className="fa-solid fa-triangle-exclamation text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#f9f9f9]">
                  Confirmer le reset
                </h3>
                <p className="text-xs text-[#b7b7b7]">
                  {selectedDossier.client_name} · {selectedDossier.product_name}
                </p>
              </div>
            </div>

            <div className="bg-[#252628] rounded-lg p-3 text-sm text-[#b7b7b7]">
              Le dossier sera remis au statut{" "}
              <strong className="text-[#f9f9f9]">QUALIFICATION</strong>. Les
              step field values seront supprimés, les documents dé-référencés,
              les step instances réinitialisées.
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#b7b7b7]">
                Raison du reset <span className="text-red-400">*</span>
              </label>
              <textarea
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Expliquez la raison du reset..."
                rows={3}
                className="w-full bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:outline-none focus:border-[#50b989] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isResetting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#2d3033] border border-[#363636] text-sm text-[#b7b7b7] hover:text-[#f9f9f9] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting || !resetReason.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {isResetting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2" />En cours…</>
                ) : (
                  <><i className="fa-solid fa-rotate-left mr-2" />Confirmer le reset</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
