import { getAgentId, requireAgentAuth } from "@/lib/auth";
import { getAgentDossiers } from "@/lib/agent/dossiers";
import { DossiersListContent } from "@/components/agent/DossiersListContent";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Mes dossiers - Espace Agent",
  description: "Liste des dossiers assignés à l'agent",
};

export default async function AgentDossiersPage() {
  const agent = await requireAgentAuth();
  const agentId = await getAgentId(agent.email);
  if (!agentId) {
    return <div>Agent not found</div>;
  }
  const dossiers = await getAgentDossiers(agentId);

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-text-primary">
                Mes dossiers
              </h1>
              <p className="text-brand-text-secondary mt-1">
                Liste des dossiers qui te sont assignés avec bouton pour copier
                toutes les informations
              </p>
            </div>
          </div>

          <DossiersListContent initialDossiers={dossiers} />
        </div>
      </div>
    </div>
  );
}
