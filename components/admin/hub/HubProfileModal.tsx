"use client";

import type { HubSubscriptionRow } from "@/lib/admin/hub-subscriptions";

interface HubProfileModalProps {
  row: HubSubscriptionRow;
  onClose: () => void;
}

export function HubProfileModal({ row, onClose }: HubProfileModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-profile-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#2D3033] border border-[#363636] rounded-xl shadow-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="hub-profile-title" className="text-lg font-semibold text-[#F9F9F9]">
            Profil membre Hub
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#B7B7B7] hover:text-[#F9F9F9] hover:bg-[#363636] rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <i className="fa-solid fa-times" />
          </button>
        </div>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-[#B7B7B7]">Membre</dt>
            <dd className="text-[#F9F9F9] font-medium">
              {row.display_name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#B7B7B7]">Email</dt>
            <dd className="text-[#F9F9F9]">{row.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-[#B7B7B7]">Plan</dt>
            <dd className="text-[#F9F9F9]">
              {row.plan === "yearly" ? "Annuel" : "Mensuel"}
            </dd>
          </div>
          <div>
            <dt className="text-[#B7B7B7]">Statut</dt>
            <dd className="text-[#F9F9F9]">{row.status}</dd>
          </div>
          <div>
            <dt className="text-[#B7B7B7]">Date inscription</dt>
            <dd className="text-[#F9F9F9]">
              {new Date(row.started_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-[#B7B7B7]">Pays</dt>
            <dd className="text-[#F9F9F9]">{row.country ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#B7B7B7]">Métier</dt>
            <dd className="text-[#F9F9F9]">{row.profession ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#B7B7B7]">Client LLC</dt>
            <dd className="text-[#F9F9F9]">
              {row.is_llc_client ? "Oui" : "Non"}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#191A1D] border border-[#363636] rounded-lg text-[#F9F9F9] hover:border-[#50B88A] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </>
  );
}
