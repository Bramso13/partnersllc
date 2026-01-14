"use client";

import { useState } from "react";
import { DossierStatus } from "@/lib/dossiers";

interface StatusChangeDropdownProps {
  dossierId: string;
  currentStatus: DossierStatus;
}

const STATUS_OPTIONS: { value: DossierStatus; label: string }[] = [
  { value: "QUALIFICATION", label: "Qualification" },
  { value: "FORM_SUBMITTED", label: "Formulaire soumis" },
  { value: "NM_PENDING", label: "NM en attente" },
  { value: "LLC_ACCEPTED", label: "LLC acceptée" },
  { value: "EIN_PENDING", label: "EIN en attente" },
  { value: "BANK_PREPARATION", label: "Préparation bancaire" },
  { value: "BANK_OPENED", label: "Banque ouverte" },
  { value: "WAITING_48H", label: "Attente 48h" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "UNDER_REVIEW", label: "En révision" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "CLOSED", label: "Fermé" },
  { value: "ERROR", label: "Erreur" },
];

export function StatusChangeDropdown({
  dossierId,
  currentStatus,
}: StatusChangeDropdownProps) {
  const [status, setStatus] = useState<DossierStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: DossierStatus) => {
    if (newStatus === status) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du changement de statut");
      }

      setStatus(newStatus);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (err) {
      console.error("Error changing status:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as DossierStatus)}
        disabled={isUpdating}
        className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-stroke rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}
      {isUpdating && (
        <p className="text-brand-text-secondary text-sm mt-2">
          Mise à jour en cours...
        </p>
      )}
    </div>
  );
}
