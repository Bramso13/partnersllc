"use client";

import { useEffect, useState } from "react";
import { NotificationRule } from "@/lib/notifications/types";
import { NotificationRulesTable } from "./NotificationRulesTable";
import { CreateRuleModal } from "./CreateRuleModal";
import { EditRuleModal } from "./EditRuleModal";
import { TestRuleModal } from "./TestRuleModal";
import { EventType } from "@/lib/events";

export function NotificationRulesContent() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [testingRule, setTestingRule] = useState<NotificationRule | null>(null);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  const fetchRules = async () => {
    try {
      setError(null);
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (eventTypeFilter) params.append("event_type", eventTypeFilter);
      if (activeFilter) params.append("is_active", activeFilter);
      if (channelFilter) params.append("channel", channelFilter);

      const response = await fetch(
        `/api/admin/notification-rules?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notification rules");
      }

      const data = await response.json();
      setRules(data.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [eventTypeFilter, activeFilter, channelFilter]);

  const handleRuleCreated = () => {
    setShowCreateModal(false);
    fetchRules();
  };

  const handleRuleUpdated = () => {
    setEditingRule(null);
    fetchRules();
  };

  const handleRuleDeleted = () => {
    fetchRules();
  };

  const handleRuleToggled = () => {
    fetchRules();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-text-secondary">
          Loading notification rules...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-text-primary">
          Notification Rules
        </h1>
        <p className="text-brand-text-secondary mt-1">
          Configure automatic notifications triggered by system events
        </p>
      </div>

      {/* Filters */}
      <div className="bg-brand-bg-secondary rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Event Type Filter */}
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Event Type
            </label>
            <select
              value={eventTypeFilter || ""}
              onChange={(e) =>
                setEventTypeFilter(e.target.value || null)
              }
              className="w-full px-3 py-2 bg-brand-bg-tertiary border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="">All Event Types</option>
              <option value="DOSSIER_CREATED">DOSSIER_CREATED</option>
              <option value="STEP_COMPLETED">STEP_COMPLETED</option>
              <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
              <option value="DOCUMENT_REVIEWED">DOCUMENT_REVIEWED</option>
              <option value="DOCUMENT_DELIVERED">DOCUMENT_DELIVERED</option>
              <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
              <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
            </select>
          </div>

          {/* Active Status Filter */}
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Status
            </label>
            <select
              value={activeFilter || ""}
              onChange={(e) =>
                setActiveFilter(e.target.value || null)
              }
              className="w-full px-3 py-2 bg-brand-bg-tertiary border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Channel
            </label>
            <select
              value={channelFilter || ""}
              onChange={(e) =>
                setChannelFilter(e.target.value || null)
              }
              className="w-full px-3 py-2 bg-brand-bg-tertiary border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="">All Channels</option>
              <option value="EMAIL">EMAIL</option>
              <option value="WHATSAPP">WHATSAPP</option>
              <option value="IN_APP">IN_APP</option>
              <option value="SMS">SMS</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(eventTypeFilter || activeFilter || channelFilter) && (
          <button
            onClick={() => {
              setEventTypeFilter(null);
              setActiveFilter(null);
              setChannelFilter(null);
            }}
            className="text-sm text-brand-accent hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          {rules.length} rule{rules.length !== 1 ? "s" : ""}
          {(eventTypeFilter || activeFilter || channelFilter) && " (filtered)"}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
        >
          + Create Rule
        </button>
      </div>

      {/* Rules Table */}
      <NotificationRulesTable
        rules={rules}
        onEdit={(rule) => setEditingRule(rule)}
        onTest={(rule) => setTestingRule(rule)}
        onDelete={handleRuleDeleted}
        onToggle={handleRuleToggled}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateRuleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleRuleCreated}
        />
      )}

      {editingRule && (
        <EditRuleModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSuccess={handleRuleUpdated}
        />
      )}

      {testingRule && (
        <TestRuleModal
          rule={testingRule}
          onClose={() => setTestingRule(null)}
        />
      )}
    </div>
  );
}
