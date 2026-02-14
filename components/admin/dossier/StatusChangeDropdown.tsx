"use client";

import { useState } from "react";
import { DossierStatus, DOSSIER_STATUS_OPTIONS } from "@/lib/dossier-status";
import { useApi } from "@/lib/api/useApi";

interface StatusChangeDropdownProps {
  dossierId: string;
  currentStatus: DossierStatus;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] text-sm focus:outline-none focus:ring-2 focus:ring-[#50b989] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

export function StatusChangeDropdown({
  dossierId,
  currentStatus,
}: StatusChangeDropdownProps) {
  const api = useApi();
  const [status, setStatus] = useState<DossierStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: DossierStatus) => {
    if (newStatus === status) return;
    setIsUpdating(true);
    setError(null);
    try {
      await api.patch(`/api/admin/dossiers/${dossierId}/status`, {
        status: newStatus,
      });
      setStatus(newStatus);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
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
        {DOSSIER_STATUS_OPTIONS.map((opt) => (
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
