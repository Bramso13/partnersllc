"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Formation,
  CreateFormationRequest,
  FormationVisibilityType,
} from "@/types/formations";
import { Product } from "@/types/products";
import { toast } from "sonner";
import { useFormations } from "@/lib/contexts/formations/FormationsContext";
import { FormationForm } from "./FormationForm";
import { FormationElementsManager } from "./FormationElementsManager";

interface FormationEditContentProps {
  formationId: string | null; // null for new formation
}

export function FormationEditContent({
  formationId,
}: FormationEditContentProps) {
  const router = useRouter();
  const { getFormation } = useFormations();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(!!formationId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getFormation(formationId)
      .then((data) => {
        if (!cancelled && data) setFormation(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load formation"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formationId]);

  const handleFormationSaved = (savedFormation: Formation) => {
    setFormation(savedFormation);
    toast.success(
      formationId ? "Formation mise à jour" : "Formation créée avec succès"
    );

    // If we just created a new formation, redirect to its edit page
    if (!formationId) {
      router.push(`/admin/formations/${savedFormation.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-text-secondary">
          Chargement de la formation...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
        <button
          onClick={() => router.push("/admin/formations")}
          className="text-brand-accent hover:text-brand-accent/80"
        >
          ← Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/admin/formations")}
            className="text-brand-accent hover:text-brand-accent/80 mb-2 flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Retour à la liste
          </button>
          <h1 className="text-3xl font-bold text-brand-text-primary">
            {formationId ? "Éditer la formation" : "Créer une formation"}
          </h1>
        </div>
      </div>

      {/* Formation Form */}
      <FormationForm formation={formation} onSaved={handleFormationSaved} />

      {/* Elements Manager - Only show for existing formations */}
      {formation && <FormationElementsManager formationId={formation.id} />}
    </div>
  );
}
