import { requireAgentAuth } from "@/lib/auth";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("agent.dashboard");
  return {
    title: t("title"),
    description: t("description"),
  };
}

async function getAgentStats(agentId: string) {
  const supabase = await createClient();

  // Get count of assigned steps (dossier_steps where assigned_agent_id = agentId)
  const { count: assignedStepsCount } = await supabase
    .from("dossier_steps")
    .select("*", { count: "exact", head: true })
    .eq("assigned_agent_id", agentId)
    .neq("status", "COMPLETED");

  // Get count of pending reviews (steps that need agent review)
  const { count: pendingReviewsCount } = await supabase
    .from("dossier_steps")
    .select("*", { count: "exact", head: true })
    .eq("assigned_agent_id", agentId)
    .eq("status", "IN_REVIEW");

  return {
    assignedSteps: assignedStepsCount || 0,
    pendingReviews: pendingReviewsCount || 0,
  };
}

export default async function AgentDashboardPage() {
  const agent = await requireAgentAuth();
  const stats = await getAgentStats(agent.id);
  const t = await getTranslations("agent.dashboard");

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              {t("welcome", {
                name: agent.full_name?.split(" ")[0] || "Agent",
              })}
            </h1>
            <p className="text-brand-text-secondary mt-1">{t("welcomeSub")}</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Assigned Steps */}
            <div className="bg-[#191A1D] rounded-2xl p-6 border border-[#363636]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <i className="fa-solid fa-list-check text-cyan-400 text-xl"></i>
                </div>
                <div>
                  <p className="text-brand-text-secondary text-sm">
                    {t("assignedSteps")}
                  </p>
                  <p className="text-3xl font-bold text-brand-text-primary">
                    {stats.assignedSteps}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Reviews */}
            <div className="bg-[#191A1D] rounded-2xl p-6 border border-[#363636]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <i className="fa-solid fa-clock text-amber-400 text-xl"></i>
                </div>
                <div>
                  <p className="text-brand-text-secondary text-sm">
                    {t("pendingReviews")}
                  </p>
                  <p className="text-3xl font-bold text-brand-text-primary">
                    {stats.pendingReviews}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder content for full dashboard (Story 5.5) */}
          <div className="bg-[#191A1D] rounded-2xl p-8 border border-[#363636] text-center">
            <i className="fa-solid fa-rocket text-brand-accent text-4xl mb-4"></i>
            <h2 className="text-xl font-semibold text-brand-text-primary mb-2">
              {t("dashboardTitle")}
            </h2>
            <p className="text-brand-text-secondary max-w-md mx-auto">
              {t("dashboardPlaceholder")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
