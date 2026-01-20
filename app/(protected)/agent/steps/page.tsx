import { requireAgentAuth } from "@/lib/auth";
import { getAgentStepQueue } from "@/lib/agent-steps";
import { StepQueueContent } from "@/components/agent/StepQueueContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes étapes - Espace Agent",
  description: "Queue des étapes assignées et disponibles pour l'agent",
};

export default async function AgentStepsPage() {
  const agent = await requireAgentAuth();
  const steps = await getAgentStepQueue(agent.email, agent.full_name);

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-text-primary">
                Mes étapes
              </h1>
              <p className="text-brand-text-secondary mt-1">
                Vue consolidée des étapes qui te sont assignées et des nouvelles
                étapes disponibles pour ton type d&apos;agent.
              </p>
            </div>
          </div>

          <StepQueueContent initialSteps={steps} />
        </div>
      </div>
    </div>
  );
}

