"use client";

import type { AgentDashboardData } from "@/types/agents";
import { CurrentStepsSection } from "./CurrentStepsSection";
import { CompletedStepsSection } from "./CompletedStepsSection";
import { AssignableStepsSection } from "./AssignableStepsSection";

interface AgentDashboardPanelProps {
  agentId: string;
  agentName: string;
  dashboardData: AgentDashboardData | null;
  isLoading: boolean;
  onAssignStep: (stepInstanceId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function AgentDashboardPanel({
  agentId,
  agentName,
  dashboardData,
  isLoading,
  onAssignStep,
  onRefresh,
}: AgentDashboardPanelProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loading skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-brand-surface border border-brand-border rounded-lg p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-brand-bg rounded w-1/2"></div>
              <div className="space-y-3">
                <div className="h-20 bg-brand-bg rounded"></div>
                <div className="h-20 bg-brand-bg rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg p-8 text-center">
        <p className="text-brand-text-secondary">
          Impossible de charger les données du dashboard.
        </p>
        <button
          onClick={onRefresh}
          className="mt-4 text-brand-gold hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-surface border border-brand-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <i className="fa-solid fa-spinner text-blue-400"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-text-primary">
                {dashboardData.currentSteps.length}
              </p>
              <p className="text-sm text-brand-text-secondary">En cours</p>
            </div>
          </div>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <i className="fa-solid fa-check text-green-400"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-text-primary">
                {dashboardData.completedSteps.length}
              </p>
              <p className="text-sm text-brand-text-secondary">Complétées (20 dernières)</p>
            </div>
          </div>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <i className="fa-solid fa-list-check text-amber-400"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-text-primary">
                {dashboardData.assignableSteps.length}
              </p>
              <p className="text-sm text-brand-text-secondary">Assignables</p>
            </div>
          </div>
        </div>
      </div>

      {/* Three sections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: En cours */}
        <CurrentStepsSection steps={dashboardData.currentSteps} />

        {/* Section 2: Historique */}
        <CompletedStepsSection steps={dashboardData.completedSteps} />

        {/* Section 3: À faire / Assignation */}
        <AssignableStepsSection
          steps={dashboardData.assignableSteps}
          agentName={agentName}
          onAssignStep={onAssignStep}
        />
      </div>
    </div>
  );
}
