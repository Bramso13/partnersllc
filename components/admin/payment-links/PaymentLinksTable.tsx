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
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleSelectAll = () => {
    if (selectedLinks.length === paymentLinks.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(paymentLinks.map((link) => link.id));
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
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(linkId)) {
      newExpanded.delete(linkId);
    } else {
      newExpanded.add(linkId);
    }
    setExpandedRows(newExpanded);
  };

  const sortedLinks = [...paymentLinks].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (!aValue) return 1;
    if (!bValue) return -1;

    const comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-600">↕</span>;
    return sortOrder === "asc" ? (
      <span className="text-brand-accent">↑</span>
    ) : (
      <span className="text-brand-accent">↓</span>
    );
  };

  if (paymentLinks.length === 0) {
    return (
      <div className="bg-brand-card-bg border border-brand-border rounded-lg p-8 text-center">
        <p className="text-brand-text-secondary">
          No payment links found. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-card-bg border border-brand-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-brand-dark-bg border-b border-brand-border">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedLinks.length === paymentLinks.length &&
                    paymentLinks.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded border-brand-border"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Token
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Prospect Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Product
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-accent"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center gap-1">
                  Created <SortIcon field="created_at" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-accent"
                onClick={() => handleSort("expires_at")}
              >
                <div className="flex items-center gap-1">
                  Expires <SortIcon field="expires_at" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-accent"
                onClick={() => handleSort("used_at")}
              >
                <div className="flex items-center gap-1">
                  Used <SortIcon field="used_at" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Converted
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
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
