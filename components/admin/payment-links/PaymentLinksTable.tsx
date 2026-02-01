"use client";

import { useState } from "react";
import { PaymentLinkWithDetails } from "@/types/payment-links";
import { PaymentLinkRow } from "./PaymentLinkRow";

interface PaymentLinksTableProps {
  paymentLinks: PaymentLinkWithDetails[];
  selectedLinks: string[];
  onSelectionChange: (selected: string[]) => void;
}

type SortField = "created_at" | "expires_at" | "used_at";
type SortOrder = "asc" | "desc";

export function PaymentLinksTable({
  paymentLinks,
  selectedLinks,
  onSelectionChange,
}: PaymentLinksTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleSelectAll = () => {
    if (selectedLinks.length === paymentLinks.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(paymentLinks.map((l) => l.id));
    }
  };

  const handleSelectLink = (linkId: string) => {
    if (selectedLinks.includes(linkId)) {
      onSelectionChange(selectedLinks.filter((id) => id !== linkId));
    } else {
      onSelectionChange([...selectedLinks, linkId]);
    }
  };

  const toggleRowExpansion = (linkId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  };

  const sortedLinks = [...paymentLinks].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (!aVal) return 1;
    if (!bVal) return -1;
    const cmp = new Date(aVal).getTime() - new Date(bVal).getTime();
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-[#363636] text-xs">↕</span>;
    }
    return (
      <span className="text-[#50b989] text-xs">
        {sortOrder === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  if (paymentLinks.length === 0) {
    return (
      <div className="rounded-xl bg-[#252628] border border-[#363636] p-8 text-center">
        <p className="text-sm text-[#b7b7b7]">
          Aucun lien de paiement. Ajustez les filtres ou générez un lien.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-[#1e1f22] border-b border-[#363636]">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={
                    paymentLinks.length > 0 &&
                    selectedLinks.length === paymentLinks.length
                  }
                  onChange={handleSelectAll}
                  className="rounded border-[#363636] bg-[#191a1d] text-[#50b989] focus:ring-[#50b989]"
                />
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-[#b7b7b7]">
                Token
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-[#b7b7b7]">
                Email prospect
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-[#b7b7b7]">
                Produit
              </th>
              <th
                className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-[#b7b7b7] cursor-pointer hover:text-[#50b989] transition-colors"
                onClick={() => handleSort("created_at")}
              >
                <span className="flex items-center gap-1">
                  Créé <SortIcon field="created_at" />
                </span>
              </th>
              <th
                className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-[#b7b7b7] cursor-pointer hover:text-[#50b989] transition-colors"
                onClick={() => handleSort("expires_at")}
              >
                <span className="flex items-center gap-1">
                  Expire <SortIcon field="expires_at" />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-[#b7b7b7]">
                Statut
              </th>
              <th
                className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-[#b7b7b7] cursor-pointer hover:text-[#50b989] transition-colors"
                onClick={() => handleSort("used_at")}
              >
                <span className="flex items-center gap-1">
                  Utilisé <SortIcon field="used_at" />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-[#b7b7b7]">
                Converti
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#363636]">
            {sortedLinks.map((link) => (
              <PaymentLinkRow
                key={link.id}
                link={link}
                isSelected={selectedLinks.includes(link.id)}
                isExpanded={expandedRows.has(link.id)}
                onSelect={handleSelectLink}
                onToggleExpand={toggleRowExpansion}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
