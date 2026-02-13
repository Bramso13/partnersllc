"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useFormations } from "@/lib/contexts/formations/FormationsContext";
import { FormationsTable } from "./FormationsTable";

export function FormationsListContent() {
  const { formations, isLoading, error, fetchFormations } = useFormations();

  useEffect(() => {
    fetchFormations();
  }, []);

  const handleFormationDeleted = () => {
    fetchFormations();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-text-secondary">
          Chargement des formations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          {formations.length} formation{formations.length !== 1 ? "s" : ""} au
          total
        </div>
        <Link
          href="/admin/formations/new"
          className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
        >
          + Créer une formation
        </Link>
      </div>

      {formations.length === 0 ? (
        <div className="bg-brand-card-bg rounded-lg p-8 text-center">
          <i className="fas fa-graduation-cap text-4xl text-brand-text-secondary mb-4"></i>
          <p className="text-brand-text-secondary">
            Aucune formation pour le moment
          </p>
          <p className="text-brand-text-secondary/70 text-sm mt-2">
            Créez votre première formation pour commencer
          </p>
        </div>
      ) : (
        <FormationsTable
          formations={formations}
          onFormationDeleted={handleFormationDeleted}
        />
      )}
    </div>
  );
}
