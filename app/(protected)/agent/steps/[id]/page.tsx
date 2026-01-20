import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAgentAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getVerificateurStepDetails,
  getCreateurStepDetails,
  getAgentByEmail,
} from "@/lib/agent-steps";
import { VerificateurStepContent } from "@/components/agent/verificateur/VerificateurStepContent";
import { CreateurStepContent } from "@/components/agent/createur/CreateurStepContent";

export const metadata: Metadata = {
  title: "Traitement Step - Espace Agent",
  description: "Traitement d'une étape assignée",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentStepDetailPage({ params }: PageProps) {
  const { id: stepInstanceId } = await params;
  const user = await requireAgentAuth();
  const isAdmin = user.role === "ADMIN";

  // Récupérer l'agent correspondant à l'utilisateur
  const agent = await getAgentByEmail(user.email);

  if (!agent && !isAdmin) {
    redirect("/agent/steps");
  }

  const agentId = agent?.id || "";
  const supabase = createAdminClient();

  // D'abord, déterminer le type de step pour router vers la bonne logique
  const { data: stepTypeCheck } = await supabase
    .from("step_instances")
    .select("step:steps(step_type)")
    .eq("id", stepInstanceId)
    .single();

  if (!stepTypeCheck) {
    redirect("/agent/steps");
  }

  const stepType = Array.isArray(stepTypeCheck.step)
    ? stepTypeCheck.step[0]?.step_type
    : stepTypeCheck.step?.step_type;

  // Router selon le type de step
  if (stepType === "ADMIN") {
    // Step ADMIN - Agent Créateur
    const stepDetails = await getCreateurStepDetails(
      stepInstanceId,
      agentId,
      isAdmin
    );

    if (!stepDetails) {
      redirect("/agent/steps");
    }

    return (
      <div className="min-h-screen bg-brand-dark-bg">
        <CreateurStepContent
          stepDetails={stepDetails}
          agentId={agentId}
          isAdmin={isAdmin}
        />
      </div>
    );

  } else if (stepType === "CLIENT") {
    // Step CLIENT - Agent Vérificateur
    const stepDetails = await getVerificateurStepDetails(
      stepInstanceId,
      agentId,
      isAdmin
    );

    if (!stepDetails) {
      redirect("/agent/steps");
    }

    return (
      <div className="min-h-screen bg-brand-dark-bg">
        <VerificateurStepContent
          stepDetails={stepDetails}
          agentId={agentId}
          isAdmin={isAdmin}
        />
      </div>
    );

  } else {
    // Type de step inconnu
    redirect("/agent/steps");
  }
}
