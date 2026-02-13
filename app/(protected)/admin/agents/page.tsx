import { requireAdminAuth } from "@/lib/auth";
import { AgentsProvider } from "@/lib/contexts/agents/AgentsContext";
import { AgentsManagementContent } from "@/components/admin/agents/AgentsManagementContent";

export const metadata = {
  title: "Gestion des agents | PARTNERS LLC Admin",
  description: "Tableau de bord de pilotage par agent",
};

export default async function AdminAgentsPage() {
  await requireAdminAuth();

  return (
    <AgentsProvider>
      <AgentsManagementContent />
    </AgentsProvider>
  );
}
