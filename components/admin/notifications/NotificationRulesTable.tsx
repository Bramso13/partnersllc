"use client";

import { useState } from "react";
import { NotificationRule, NotificationChannel } from "@/lib/notifications/types";

interface NotificationRulesTableProps {
  rules: NotificationRule[];
  onEdit: (rule: NotificationRule) => void;
  onTest: (rule: NotificationRule) => void;
  onDelete: () => void;
  onToggle: () => void;
}

export function NotificationRulesTable({
  rules,
  onEdit,
  onTest,
  onDelete,
  onToggle,
}: NotificationRulesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) {
      return;
    }

    setDeletingId(ruleId);
    try {
      const response = await fetch(`/api/admin/notification-rules/${ruleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete rule");
      }

      onDelete();
    } catch (error) {
      console.error("Error deleting rule:", error);
      alert("Failed to delete rule. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (ruleId: string) => {
    setTogglingId(ruleId);
    try {
      const response = await fetch(
        `/api/admin/notification-rules/${ruleId}/toggle`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle rule");
      }

      onToggle();
    } catch (error) {
      console.error("Error toggling rule:", error);
      alert("Failed to toggle rule. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  const getChannelBadgeColor = (channel: NotificationChannel) => {
    switch (channel) {
      case "EMAIL":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "WHATSAPP":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "IN_APP":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "SMS":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (rules.length === 0) {
    return (
      <div className="bg-brand-bg-secondary rounded-lg p-8 text-center text-brand-text-secondary">
        No notification rules found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="bg-brand-bg-secondary rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-brand-bg-tertiary border-b border-brand-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-brand-text-secondary">
                Event Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-brand-text-secondary">
                Template
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-brand-text-secondary">
                Channels
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-brand-text-secondary">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-brand-text-secondary">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-brand-text-secondary">
                Description
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-brand-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rules.map((rule) => (
              <tr
                key={rule.id}
                className="hover:bg-brand-bg-tertiary/50 transition-colors"
              >
                {/* Event Type */}
                <td className="px-4 py-3">
                  <code className="text-sm bg-brand-bg-tertiary px-2 py-1 rounded text-brand-accent">
                    {rule.event_type}
                  </code>
                </td>

                {/* Template */}
                <td className="px-4 py-3">
                  <span className="text-sm text-brand-text-primary">
                    {rule.template_code}
                  </span>
                </td>

                {/* Channels */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {rule.channels.map((channel) => (
                      <span
                        key={channel}
                        className={`text-xs px-2 py-1 rounded border ${getChannelBadgeColor(
                          channel
                        )}`}
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Priority */}
                <td className="px-4 py-3">
                  <span className="text-sm text-brand-text-secondary">
                    {rule.priority}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    disabled={togglingId === rule.id}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      rule.is_active
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                    } ${
                      togglingId === rule.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {togglingId === rule.id
                      ? "..."
                      : rule.is_active
                      ? "Active"
                      : "Inactive"}
                  </button>
                </td>

                {/* Description */}
                <td className="px-4 py-3">
                  <span className="text-sm text-brand-text-secondary line-clamp-2">
                    {rule.description}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onTest(rule)}
                      className="text-sm text-brand-accent hover:underline"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => onEdit(rule)}
                      className="text-sm text-brand-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={deletingId === rule.id}
                      className="text-sm text-red-400 hover:underline disabled:opacity-50"
                    >
                      {deletingId === rule.id ? "..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
