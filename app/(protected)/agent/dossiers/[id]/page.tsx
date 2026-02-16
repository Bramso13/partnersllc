import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAgentId, requireAgentAuth } from "@/lib/auth";
import { getDossierAllData } from "@/lib/agent/dossiers";
import { getAgentAssignmentTypesOnDossier } from "@/lib/agent/roles";
import { DossierDetailContent } from "@/components/agent/DossierDetailContent";

export async function generateMetadata(): Promise<Metadata> {
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations("agent.dossiers");
  return {
    title: t("detailTitle"),
    description: t("detailDescription"),
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentDossierDetailPage({ params }: PageProps) {
  const user = await requireAgentAuth();
  const agentId = await getAgentId(user.email);

  if (!agentId) {
    notFound();
  }

  const { id: dossierId } = await params;

  try {
    // Fetch dossier data (includes access control check)
    const dossierData = await getDossierAllData(dossierId, agentId);

    if (!dossierData) {
      notFound();
    }

    // Rôles de l'agent sur ce dossier (VERIFICATEUR et/ou CREATEUR pour double rôle)
    const agentRolesOnDossier = await getAgentAssignmentTypesOnDossier(
      agentId,
      dossierId
    );

    return (
      <div className="min-h-screen bg-brand-dark-bg">
        <DossierDetailContent
          dossierData={dossierData}
          agentId={agentId}
          agentRolesOnDossier={agentRolesOnDossier}
        />
      </div>
    );
  } catch (error: any) {
    console.error("Error fetching dossier detail:", error);

    // If access denied, return 404 (don't reveal existence of dossier)
    if (error.message === "Agent does not have access to this dossier") {
      notFound();
    }

    // For other errors, also return 404 to avoid exposing internal errors
    notFound();
  }
}
