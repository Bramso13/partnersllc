"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Formation } from "@/types/formations";
import { format } from "date-fns";
import { toast } from "sonner";
import { useFormations } from "@/lib/contexts/formations/FormationsContext";
import { useApi } from "@/lib/api/useApi";

interface FormationsTableProps {
  formations: Formation[];
  onFormationDeleted: () => void;
}

export function FormationsTable({
  formations,
  onFormationDeleted,
}: FormationsTableProps) {
  const router = useRouter();
  const { deleteFormation } = useFormations();
  const api = useApi();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [elementsCount, setElementsCount] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    formations.forEach(async (formation) => {
      try {
        const data = await api.get<{ elements?: unknown[] }>(
          `/api/admin/formations/${formation.id}/elements`
        );
        setElementsCount((prev) => ({
          ...prev,
          [formation.id]: data?.elements?.length ?? 0,
        }));
      } catch {
        // ignore
      }
    });
  }, [formations]);

  const handleDelete = async (formation: Formation) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer la formation "${formation.titre}" ?`
      )
    ) {
      return;
    }

    setDeletingId(formation.id);
    try {
      await deleteFormation(formation.id);
      toast.success("Formation supprimée avec succès");
      onFormationDeleted();
    } catch {
      toast.error("Erreur lors de la suppression de la formation");
    } finally {
      setDeletingId(null);
    }
  };

  const getVisibilityLabel = (formation: Formation): string => {
    switch (formation.visibility_type) {
      case "all":
        return "Tous les clients";
      case "by_product_ids": {
        const config = formation.visibility_config as {
          product_ids?: string[];
        };
        const count = config.product_ids?.length || 0;
        return `${count} produit${count > 1 ? "s" : ""}`;
      }
      case "by_dossier_type":
        return "Par type de dossier";
      default:
        return formation.visibility_type;
    }
  };

  return (
    <div className="bg-brand-card-bg border border-brand-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-brand-dark-bg/50 border-b border-brand-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Vignette
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Titre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Visibilité
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Éléments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Créée le
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {formations.map((formation) => (
              <tr
                key={formation.id}
                className="hover:bg-brand-dark-bg/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-brand-dark-bg/50 flex items-center justify-center">
                    {formation.vignette_url || formation.vignette_path ? (
                      <img
                        src={formation.vignette_url || formation.vignette_path!}
                        alt={formation.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-graduation-cap text-2xl text-brand-text-secondary"></i>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-brand-text-primary">
                    {formation.titre}
                  </div>
                  {formation.description && (
                    <div className="text-sm text-brand-text-secondary truncate max-w-xs mt-1">
                      {formation.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-brand-accent/10 text-brand-accent">
                    {getVisibilityLabel(formation)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-primary">
                  {elementsCount[formation.id] !== undefined ? (
                    <span>
                      {elementsCount[formation.id]} élément
                      {elementsCount[formation.id] > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-brand-text-secondary">...</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                  {format(new Date(formation.created_at), "dd/MM/yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        router.push(`/admin/formations/${formation.id}`)
                      }
                      className="text-brand-accent hover:text-brand-accent/80 font-medium"
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Éditer
                    </button>
                    <button
                      onClick={() => handleDelete(formation)}
                      disabled={deletingId === formation.id}
                      className="text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
                    >
                      <i className="fas fa-trash mr-1"></i>
                      {deletingId === formation.id
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
