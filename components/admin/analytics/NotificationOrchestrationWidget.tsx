"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrchestrationStats {
  total_active_rules: number;
  events_last_24h: number;
  rule_executions_last_24h: number;
  notifications_created_last_24h: number;
  success_rate_last_24h: number;
}

interface FailedExecution {
  id: string;
  error_message: string | null;
  retry_count: number;
  executed_at: string;
  notification_rules: {
    event_type: string;
    template_code: string;
  };
}

export function NotificationOrchestrationWidget() {
  const [stats, setStats] = useState<OrchestrationStats | null>(null);
  const [failedExecutions, setFailedExecutions] = useState<FailedExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/notification-rules/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data.stats);
      setFailedExecutions(data.failed_executions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-brand-bg-secondary rounded-lg p-6">
        <div className="text-brand-text-secondary">Loading orchestration stats...</div>
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

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-brand-bg-secondary rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-text-primary">
          Notification Orchestration
        </h3>
        <Link
          href="/admin/notification-rules"
          className="text-sm text-brand-accent hover:underline"
        >
          Manage Rules →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Active Rules */}
        <div className="bg-brand-bg-tertiary rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-text-primary">
            {stats.total_active_rules}
          </div>
          <div className="text-sm text-brand-text-secondary mt-1">Active Rules</div>
        </div>

        {/* Events (24h) */}
        <div className="bg-brand-bg-tertiary rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-text-primary">
            {stats.events_last_24h}
          </div>
          <div className="text-sm text-brand-text-secondary mt-1">Events (24h)</div>
        </div>

        {/* Executions (24h) */}
        <div className="bg-brand-bg-tertiary rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-text-primary">
            {stats.rule_executions_last_24h}
          </div>
          <div className="text-sm text-brand-text-secondary mt-1">
            Executions (24h)
          </div>
        </div>

        {/* Notifications (24h) */}
        <div className="bg-brand-bg-tertiary rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-text-primary">
            {stats.notifications_created_last_24h}
          </div>
          <div className="text-sm text-brand-text-secondary mt-1">
            Notifications (24h)
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-brand-bg-tertiary rounded-lg p-4">
          <div
            className={`text-2xl font-bold ${
              stats.success_rate_last_24h >= 90
                ? "text-green-400"
                : stats.success_rate_last_24h >= 70
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {stats.success_rate_last_24h}%
          </div>
          <div className="text-sm text-brand-text-secondary mt-1">Success Rate</div>
        </div>
      </div>

      {/* Failed Executions */}
      {failedExecutions.length > 0 && (
        <div>
          <div className="text-sm font-medium text-brand-text-primary mb-3">
            Recent Failures ({failedExecutions.length})
          </div>
          <div className="space-y-2">
            {failedExecutions.slice(0, 5).map((execution) => (
              <div
                key={execution.id}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-red-400">
                      {execution.notification_rules.event_type} →{" "}
                      {execution.notification_rules.template_code}
                    </div>
                    <div className="text-xs text-brand-text-secondary mt-1 truncate">
                      {execution.error_message || "Unknown error"}
                    </div>
                  </div>
                  <div className="text-xs text-brand-text-secondary whitespace-nowrap">
                    Retry: {execution.retry_count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Indicator */}
      <div className="pt-4 border-t border-brand-border">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              stats.success_rate_last_24h >= 90
                ? "bg-green-400"
                : stats.success_rate_last_24h >= 70
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
          />
          <span className="text-sm text-brand-text-secondary">
            System Health:{" "}
            {stats.success_rate_last_24h >= 90
              ? "Excellent"
              : stats.success_rate_last_24h >= 70
              ? "Good"
              : "Needs Attention"}
          </span>
        </div>
      </div>
    </div>
  );
}
