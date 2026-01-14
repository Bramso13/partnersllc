"use client";

import Link from "next/link";
import type { DossierWithDetailsAndClient } from "@/lib/dossiers";

interface AdminDossierCardProps {
  dossier: DossierWithDetailsAndClient;
}

export function AdminDossierCard({ dossier }: AdminDossierCardProps) {
  const statusConfig = getStatusConfig(dossier.status);

  return (
    <Link
      href={`/admin/dossiers/${dossier.id}`}
      className="block group"
    >
      <div className="bg-[#2D3033] border border-[#363636] rounded-xl p-6 hover:scale-[1.02] hover:border-[#00F0FF] transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#F9F9F9] mb-1">
              {dossier.user?.full_name || "Client inconnu"}
            </h3>
            <p className="text-sm text-[#B7B7B7]">
              {dossier.user?.email || ""}
            </p>
          </div>
          <StatusBadge status={dossier.status} config={statusConfig} />
        </div>

        {/* Product */}
        <div className="mb-4">
          <div className="text-sm text-[#B7B7B7]">
            {dossier.product?.name || "Sans produit"}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#B7B7B7]">Progression</span>
            <span className="text-[#F9F9F9] font-semibold">
              {dossier.progress_percentage || 0}%
            </span>
          </div>
          <div className="w-full bg-[#191A1D] rounded-full h-2">
            <div
              className="bg-[#00F0FF] h-2 rounded-full transition-all"
              style={{ width: `${dossier.progress_percentage || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step */}
        {dossier.current_step_instance?.step && (
          <div className="mb-4 text-sm">
            <span className="text-[#B7B7B7]">Étape actuelle: </span>
            <span className="text-[#F9F9F9]">
              {dossier.current_step_instance.step.label ||
                dossier.current_step_instance.step.code}
            </span>
          </div>
        )}

        {/* Assigned Agent */}
        {dossier.assigned_agent && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-user-tie text-[#B7B7B7]"></i>
            <span className="text-[#B7B7B7]">
              {dossier.assigned_agent.full_name || dossier.assigned_agent.email}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#B7B7B7]">
            {new Date(dossier.created_at).toLocaleDateString("fr-FR")}
          </div>

          {dossier.pending_documents_count && dossier.pending_documents_count > 0 && (
            <div className="px-2 py-1 bg-[#FACC15]/10 border border-[#FACC15]/20 rounded text-xs text-[#FACC15] font-semibold">
              <i className="fa-solid fa-clock mr-1"></i>
              {dossier.pending_documents_count} doc{dossier.pending_documents_count > 1 ? "s" : ""} en attente
            </div>
          )}
        </div>

        {/* Hover CTA */}
        <div className="mt-4 pt-4 border-t border-[#363636] opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-sm text-[#00F0FF] font-semibold flex items-center justify-center gap-2">
            Voir le dossier
            <i className="fa-solid fa-arrow-right"></i>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status, config }: { status: string; config: { color: string; label: string } }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function getStatusConfig(status: string): { color: string; label: string } {
  const configs: Record<string, { color: string; label: string }> = {
    QUALIFICATION: { color: "bg-blue-400/10 text-blue-400 border-blue-400/20", label: "Qualification" },
    FORM_SUBMITTED: { color: "bg-purple-400/10 text-purple-400 border-purple-400/20", label: "Formulaire" },
    NM_PENDING: { color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", label: "NM Pending" },
    LLC_ACCEPTED: { color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", label: "LLC Accepté" },
    EIN_PENDING: { color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", label: "EIN Pending" },
    BANK_PREPARATION: { color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20", label: "Prép. Bancaire" },
    BANK_OPENED: { color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20", label: "Banque Ouverte" },
    WAITING_48H: { color: "bg-orange-400/10 text-orange-400 border-orange-400/20", label: "Attente 48H" },
    IN_PROGRESS: { color: "bg-orange-400/10 text-orange-400 border-orange-400/20", label: "En cours" },
    UNDER_REVIEW: { color: "bg-orange-400/10 text-orange-400 border-orange-400/20", label: "En révision" },
    COMPLETED: { color: "bg-green-400/10 text-green-400 border-green-400/20", label: "Terminé" },
    CLOSED: { color: "bg-green-400/10 text-green-400 border-green-400/20", label: "Fermé" },
    ERROR: { color: "bg-red-400/10 text-red-400 border-red-400/20", label: "Erreur" },
  };

  return configs[status] || { color: "bg-gray-400/10 text-gray-400 border-gray-400/20", label: status };
}
