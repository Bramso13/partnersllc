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

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-sm focus:outline-none focus:ring-2 focus:ring-[#50b989] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

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
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as DossierStatus)}
        disabled={isUpdating}
        className={inputClass}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {isUpdating && (
        <p className="text-xs text-[#b7b7b7] flex items-center gap-1">
          <i className="fa-solid fa-spinner fa-spin" /> Mise à jour…
        </p>
      )}
    </div>
  );
}
