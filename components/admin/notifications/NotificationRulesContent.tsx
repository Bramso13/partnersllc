"use client";

import { useEffect, useState, useCallback } from "react";
import { NotificationRulesTable } from "./NotificationRulesTable";
import { CreateRuleModal } from "./CreateRuleModal";
import { EditRuleModal } from "./EditRuleModal";
import { TestRuleModal } from "./TestRuleModal";
import { useNotifications } from "@/lib/contexts/notifications/NotificationsContext";

export function NotificationRulesContent() {
  const { rules, isLoading: loading, error, fetchRules } = useNotifications();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<
    import("@/lib/notifications/types").NotificationRule | null
  >(null);
  const [testingRule, setTestingRule] = useState<
    import("@/lib/notifications/types").NotificationRule | null
  >(null);

  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  const loadRules = useCallback(() => {
    fetchRules({
      ...(eventTypeFilter ? { event_type: eventTypeFilter } : {}),
      ...(activeFilter ? { is_active: activeFilter } : {}),
      ...(channelFilter ? { channel: channelFilter } : {}),
    });
  }, [eventTypeFilter, activeFilter, channelFilter]);

  useEffect(() => {
    loadRules();
  }, []);

  const handleRuleCreated = () => {
    setShowCreateModal(false);
    loadRules();
  };

  const handleRuleUpdated = () => {
    setEditingRule(null);
    loadRules();
  };

  const handleRuleDeleted = () => {
    loadRules();
  };

  const handleRuleToggled = () => {
    loadRules();
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
              onChange={(e) => setEventTypeFilter(e.target.value || null)}
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
              onChange={(e) => setActiveFilter(e.target.value || null)}
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
              onChange={(e) => setChannelFilter(e.target.value || null)}
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
