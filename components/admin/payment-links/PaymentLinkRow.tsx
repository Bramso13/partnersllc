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

export function PaymentLinkRow({
  link,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: PaymentLinkRowProps) {
  const [copied, setCopied] = useState(false);

  const truncateToken = (token: string) => {
    if (token.length <= 16) return token;
    return `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
      USED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      EXPIRED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium border ${
          styles[status as keyof typeof styles] || styles.EXPIRED
        }`}
      >
        {status}
      </span>
    );
  };

  const getConversionIndicator = () => {
    if (link.order && link.order.status === "PAID") {
      return <span className="text-green-400 text-lg">✓</span>;
    }
    if (link.order) {
      return <span className="text-red-400 text-lg">✗</span>;
    }
    return <span className="text-gray-600">—</span>;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const fullUrl = `${window.location.origin}/register/${link.token}`;

  return (
    <>
      <tr
        className={`hover:bg-brand-dark-bg/50 transition-colors ${
          isSelected ? "bg-brand-accent/10" : ""
        }`}
      >
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(link.id)}
            className="rounded border-brand-border"
          />
        </td>
        <td className="px-4 py-3 text-sm text-brand-text-primary font-mono">
          {truncateToken(link.token)}
        </td>
        <td className="px-4 py-3 text-sm text-brand-text-primary">
          {link.prospect_email}
        </td>
        <td className="px-4 py-3 text-sm text-brand-text-primary">
          {link.product?.name || "—"}
        </td>
        <td className="px-4 py-3 text-sm text-brand-text-secondary">
          {formatDate(link.created_at)}
        </td>
        <td className="px-4 py-3 text-sm text-brand-text-secondary">
          {formatDate(link.expires_at)}
        </td>
        <td className="px-4 py-3">{getStatusBadge(link.status)}</td>
        <td className="px-4 py-3 text-sm text-brand-text-secondary">
          {formatDate(link.used_at)}
        </td>
        <td className="px-4 py-3 text-center">{getConversionIndicator()}</td>
        <td className="px-4 py-3">
          <button
            onClick={() => onToggleExpand(link.id)}
            className="text-brand-accent hover:text-brand-accent/80 transition-colors"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && (
        <tr className="bg-brand-dark-bg/30">
          <td colSpan={10} className="px-4 py-4">
            <div className="space-y-4">
              {/* Full URL */}
              <div>
                <h4 className="text-sm font-medium text-brand-text-secondary mb-2">
                  Payment Link URL
                </h4>
                <div className="flex items-center gap-2 bg-brand-card-bg border border-brand-border rounded-lg p-3">
                  <code className="flex-1 text-sm text-brand-text-primary font-mono break-all">
                    {fullUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(fullUrl)}
                    className="px-3 py-1.5 bg-brand-accent text-white rounded text-sm hover:bg-brand-accent/90 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* User Details */}
              {link.used_by_user && (
                <div>
                  <h4 className="text-sm font-medium text-brand-text-secondary mb-2">
                    Used By
                  </h4>
                  <p className="text-sm text-brand-text-primary">
                    {link.used_by_user.full_name || "User"}
                  </p>
                </div>
              )}

              {/* Order Details */}
              {link.order && (
                <div>
                  <h4 className="text-sm font-medium text-brand-text-secondary mb-2">
                    Order Details
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-brand-text-secondary">Order ID</p>
                      <p className="text-brand-text-primary font-mono">
                        {link.order.id.substring(0, 8)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-brand-text-secondary">Status</p>
                      <p className="text-brand-text-primary">
                        {link.order.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-brand-text-secondary">Amount</p>
                      <p className="text-brand-text-primary">
                        {link.order.currency}{" "}
                        {(link.order.amount / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium text-brand-text-secondary mb-2">
                  Timeline
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-brand-text-secondary">
                      Created
                    </span>
                    <span className="text-brand-text-primary">
                      {new Date(link.created_at).toLocaleString()}
                    </span>
                  </div>
                  {link.used_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-brand-text-secondary">
                        Used
                      </span>
                      <span className="text-brand-text-primary">
                        {new Date(link.used_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {link.order?.paid_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-brand-text-secondary">
                        Paid
                      </span>
                      <span className="text-brand-text-primary">
                        {new Date(link.order.paid_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {link.expires_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-brand-text-secondary">
                        Expires
                      </span>
                      <span className="text-brand-text-primary">
                        {new Date(link.expires_at).toLocaleString()}
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
