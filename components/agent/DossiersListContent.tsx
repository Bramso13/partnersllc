"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AgentDossierListItem } from "@/lib/agent/dossiers";
import { formatDossierInfoForCopy } from "@/lib/agent/copy-dossier-info";
import { toast } from "sonner";

type FilterType = "all" | "in_progress" | "completed";
type SortField = "date" | "name" | "status";

interface DossiersListContentProps {
  initialDossiers: AgentDossierListItem[];
}

export function DossiersListContent({
  initialDossiers,
}: DossiersListContentProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortAscending, setSortAscending] = useState(false);
  const [copyingDossierId, setCopyingDossierId] = useState<string | null>(null);

  // Filter dossiers
  const filteredDossiers = useMemo(() => {
    let result = [...initialDossiers];

    if (filter === "in_progress") {
      result = result.filter(
        (d) => d.status !== "COMPLETED" && d.status !== "CLOSED"
      );
    } else if (filter === "completed") {
      result = result.filter(
        (d) => d.status === "COMPLETED" || d.status === "CLOSED"
      );
    }

    return result;
  }, [initialDossiers, filter]);

  // Sort dossiers
  const sortedDossiers = useMemo(() => {
    const result = [...filteredDossiers];

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "name":
          comparison = (a.client_full_name || "").localeCompare(
            b.client_full_name || ""
          );
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortAscending ? comparison : -comparison;
    });

    return result;
  }, [filteredDossiers, sortField, sortAscending]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(false);
    }
  };

  // Copy dossier info
  const handleCopyInfo = async (
    e: React.MouseEvent<HTMLButtonElement>,
    dossierId: string
  ) => {
    e.stopPropagation(); // Prevent row click
    try {
      setCopyingDossierId(dossierId);

      // Fetch all dossier data
      const response = await fetch(`/api/agent/dossiers/${dossierId}/all-data`);

      if (!response.ok) {
        throw new Error("Failed to fetch dossier data");
      }

      const data = await response.json();

      // Format the data
      const formattedText = formatDossierInfoForCopy(data);

      // Copy to clipboard
      await navigator.clipboard.writeText(formattedText);

      toast.success("Toutes les informations copiées");
    } catch (error) {
      console.error("Error copying dossier info:", error);
      toast.error("Erreur lors de la copie des informations");
    } finally {
      setCopyingDossierId(null);
    }
  };

  // Handle row click
  const handleRowClick = (dossierId: string) => {
    router.push(`/agent/dossiers/${dossierId}`);
  };

  // Format status for display
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      QUALIFICATION: "Qualification",
      FORM_SUBMITTED: "Formulaire soumis",
      NM_PENDING: "NM en attente",
      LLC_ACCEPTED: "LLC acceptée",
      EIN_PENDING: "EIN en attente",
      BANK_PREPARATION: "Préparation bancaire",
      BANK_OPENED: "Banque ouverte",
      WAITING_48H: "Attente 48h",
      IN_PROGRESS: "En cours",
      UNDER_REVIEW: "En révision",
      COMPLETED: "Complété",
      CLOSED: "Fermé",
      ERROR: "Erreur",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "all"
              ? "bg-brand-accent text-white"
              : "bg-[#191A1D] text-brand-text-secondary border border-[#363636] hover:border-brand-accent"
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter("in_progress")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "in_progress"
              ? "bg-brand-accent text-white"
              : "bg-[#191A1D] text-brand-text-secondary border border-[#363636] hover:border-brand-accent"
          }`}
        >
          En cours
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "completed"
              ? "bg-brand-accent text-white"
              : "bg-[#191A1D] text-brand-text-secondary border border-[#363636] hover:border-brand-accent"
          }`}
        >
          Complétés
        </button>
      </div>

      {/* Results count */}
      <div className="text-brand-text-secondary text-sm">
        {sortedDossiers.length} dossier{sortedDossiers.length !== 1 ? "s" : ""}
      </div>

      {/* Table */}
      <div className="bg-[#191A1D] rounded-2xl border border-[#363636] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#363636]">
                <th
                  className="text-left p-4 text-brand-text-secondary font-medium cursor-pointer hover:text-brand-text-primary transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Prénom / Nom
                    {sortField === "name" && (
                      <i
                        className={`fa-solid fa-chevron-${sortAscending ? "up" : "down"} text-xs`}
                      />
                    )}
                  </div>
                </th>
                <th className="text-left p-4 text-brand-text-secondary font-medium">
                  Nom société
                </th>
                <th
                  className="text-left p-4 text-brand-text-secondary font-medium cursor-pointer hover:text-brand-text-primary transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-2">
                    État du dossier
                    {sortField === "status" && (
                      <i
                        className={`fa-solid fa-chevron-${sortAscending ? "up" : "down"} text-xs`}
                      />
                    )}
                  </div>
                </th>
                <th className="text-left p-4 text-brand-text-secondary font-medium">
                  Step actuelle
                </th>
                <th
                  className="text-left p-4 text-brand-text-secondary font-medium cursor-pointer hover:text-brand-text-primary transition-colors"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-2">
                    Date création
                    {sortField === "date" && (
                      <i
                        className={`fa-solid fa-chevron-${sortAscending ? "up" : "down"} text-xs`}
                      />
                    )}
                  </div>
                </th>
                <th className="text-right p-4 text-brand-text-secondary font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDossiers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-brand-text-secondary"
                  >
                    Aucun dossier trouvé
                  </td>
                </tr>
              ) : (
                sortedDossiers.map((dossier) => {
                  const nameParts = dossier.client_full_name?.split(" ") || [];
                  const firstName = nameParts[0] || "N/A";
                  const lastName = nameParts.slice(1).join(" ") || "N/A";

                  return (
                    <tr
                      key={dossier.id}
                      onClick={() => handleRowClick(dossier.id)}
                      className="border-b border-[#363636] last:border-b-0 hover:bg-[#1F2023] transition-colors cursor-pointer"
                    >
                      <td className="p-4 text-brand-text-primary">
                        {firstName} {lastName}
                      </td>
                      <td className="p-4 text-brand-text-primary">
                        {dossier.client_company_name || "N/A"}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400">
                          {formatStatus(dossier.status)}
                        </span>
                      </td>
                      <td className="p-4 text-brand-text-primary">
                        {dossier.current_step_label || "N/A"}
                      </td>
                      <td className="p-4 text-brand-text-secondary text-sm">
                        {new Date(dossier.created_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => handleCopyInfo(e, dossier.id)}
                          disabled={copyingDossierId === dossier.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {copyingDossierId === dossier.id ? (
                            <>
                              <i className="fa-solid fa-spinner fa-spin" />
                              Copie...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-copy" />
                              Copier les infos
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
