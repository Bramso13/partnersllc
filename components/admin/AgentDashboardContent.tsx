"use client";

import { useCallback, useEffect, useState } from "react";
import { AgentStats, ActivityEvent, AgentDossier } from "@/lib/agent-metrics";
import { useApi } from "@/lib/api/useApi";
import { StatsCards } from "./StatsCards";
import { ActivityFeed } from "./ActivityFeed";
import { MyDossiersSection } from "./MyDossiersSection";
import { PerformanceChart } from "./PerformanceChart";

interface AgentDashboardContentProps {
  agentId: string;
}

export function AgentDashboardContent({
  agentId,
}: AgentDashboardContentProps) {
  const api = useApi();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [dossiers, setDossiers] = useState<AgentDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<{
        stats?: AgentStats;
        activities?: ActivityEvent[];
        dossiers?: AgentDossier[];
      }>(`/api/admin/dashboard?agentId=${agentId}`);
      setStats(data?.stats ?? null);
      setActivities(data?.activities ?? []);
      setDossiers(data?.dossiers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [api, agentId]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-text-secondary">Chargement...</div>
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
    <div className="space-y-8">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes 2 columns on desktop */}
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} />
        </div>

        {/* Performance Chart - Takes 1 column on desktop */}
        <div className="lg:col-span-1">
          <PerformanceChart agentId={agentId} />
        </div>
      </div>

      {/* My Dossiers Section */}
      <MyDossiersSection dossiers={dossiers} />
    </div>
  );
}