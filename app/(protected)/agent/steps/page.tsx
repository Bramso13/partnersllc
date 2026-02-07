import { requireAgentAuth } from "@/lib/auth";
import { getAgentStepQueue } from "@/lib/agent-steps";
import { StepQueueContent } from "@/components/agent/StepQueueContent";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("agent.steps");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default async function AgentStepsPage() {
  const agent = await requireAgentAuth();
  const steps = await getAgentStepQueue(agent.email, agent.full_name);
  const t = await getTranslations("agent.steps");

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-text-primary">
                {t("mySteps")}
              </h1>
              <p className="text-brand-text-secondary mt-1">
                {t("listDescription")}
              </p>
            </div>
          </div>

          <StepQueueContent initialSteps={steps} />
        </div>
      </div>
    </div>
  );
}

