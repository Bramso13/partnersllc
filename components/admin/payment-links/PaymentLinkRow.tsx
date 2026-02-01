"use client";

import { useState } from "react";
import { PaymentLinkWithDetails } from "@/types/payment-links";

interface PaymentLinkRowProps {
  link: PaymentLinkWithDetails;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (linkId: string) => void;
  onToggleExpand: (linkId: string) => void;
}

function truncateToken(token: string, max = 16) {
  if (token.length <= max) return token;
  return `${token.slice(0, 8)}…${token.slice(-8)}`;
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  USED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  EXPIRED: "bg-[#363636] text-[#b7b7b7] border-[#363636]",
};

export function PaymentLinkRow({
  link,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: PaymentLinkRowProps) {
  const [copied, setCopied] = useState(false);

  const statusClass = statusStyles[link.status] ?? statusStyles.EXPIRED;
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register/${link.token}`
      : "";

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const conversionIndicator = () => {
    if (link.order?.status === "PAID") {
      return <span className="text-emerald-400 text-sm"><i className="fa-solid fa-check" /></span>;
    }
    if (link.order) {
      return <span className="text-red-400 text-sm"><i className="fa-solid fa-times" /></span>;
    }
    return <span className="text-[#363636]">—</span>;
  };

  return (
    <>
      <tr
        className={`transition-colors ${
          isSelected ? "bg-[#50b989]/10" : "hover:bg-[#1e1f22]/50"
        }`}
      >
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(link.id)}
            className="rounded border-[#363636] bg-[#191a1d] text-[#50b989] focus:ring-[#50b989]"
          />
        </td>
        <td className="px-4 py-3 text-sm font-mono text-[#f9f9f9]">
          {truncateToken(link.token)}
        </td>
        <td className="px-4 py-3 text-sm text-[#f9f9f9]">
          {link.prospect_email}
        </td>
        <td className="px-4 py-3 text-sm text-[#f9f9f9]">
          {link.product?.name ?? "—"}
        </td>
        <td className="px-4 py-3 text-sm text-[#b7b7b7]">
          {formatDate(link.created_at)}
        </td>
        <td className="px-4 py-3 text-sm text-[#b7b7b7]">
          {formatDate(link.expires_at)}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${statusClass}`}
          >
            {link.status}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-[#b7b7b7]">
          {formatDate(link.used_at)}
        </td>
        <td className="px-4 py-3 text-center">
          {conversionIndicator()}
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => onToggleExpand(link.id)}
            className="text-[#50b989] hover:text-[#50b989]/80 transition-colors p-1"
            aria-label={isExpanded ? "Replier" : "Développer"}
          >
            <i className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"} text-xs`} />
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-[#1e1f22]/50">
          <td colSpan={10} className="px-4 py-4">
            <div className="space-y-4 rounded-lg bg-[#252628] border border-[#363636] p-4">
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#b7b7b7] mb-2">
                  URL du lien
                </h4>
                <div className="flex items-center gap-2 rounded-lg bg-[#1e1f22] border border-[#363636] p-3">
                  <code className="flex-1 text-xs font-mono text-[#f9f9f9] break-all">
                    {fullUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(fullUrl)}
                    className="px-3 py-1.5 rounded-lg bg-[#50b989] text-[#191a1d] text-xs font-medium hover:bg-[#50b989]/90 shrink-0"
                  >
                    {copied ? "Copié" : "Copier"}
                  </button>
                </div>
              </div>

              {link.used_by_user && (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-[#b7b7b7] mb-1.5">
                    Utilisé par
                  </h4>
                  <p className="text-sm text-[#f9f9f9]">
                    {link.used_by_user.full_name ?? "Utilisateur"}
                  </p>
                </div>
              )}

              {link.order && (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-[#b7b7b7] mb-2">
                    Commande
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] text-[#b7b7b7] uppercase">ID commande</p>
                      <p className="font-mono text-[#f9f9f9] text-xs mt-0.5">
                        {link.order.id.slice(0, 8)}…
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#b7b7b7] uppercase">Statut</p>
                      <p className="text-[#f9f9f9] text-xs mt-0.5">
                        {link.order.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#b7b7b7] uppercase">Montant</p>
                      <p className="text-[#f9f9f9] text-xs mt-0.5">
                        {link.order.currency} {(link.order.amount / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#b7b7b7] mb-2">
                  Chronologie
                </h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex gap-3">
                    <span className="w-20 text-[#b7b7b7] shrink-0">Créé</span>
                    <span className="text-[#f9f9f9]">
                      {new Date(link.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  {link.used_at && (
                    <div className="flex gap-3">
                      <span className="w-20 text-[#b7b7b7] shrink-0">Utilisé</span>
                      <span className="text-[#f9f9f9]">
                        {new Date(link.used_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  )}
                  {link.order?.paid_at && (
                    <div className="flex gap-3">
                      <span className="w-20 text-[#b7b7b7] shrink-0">Payé</span>
                      <span className="text-[#f9f9f9]">
                        {new Date(link.order.paid_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  )}
                  {link.expires_at && (
                    <div className="flex gap-3">
                      <span className="w-20 text-[#b7b7b7] shrink-0">Expire</span>
                      <span className="text-[#f9f9f9]">
                        {new Date(link.expires_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
