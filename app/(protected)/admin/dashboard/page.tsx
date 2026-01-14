import { requireAdminAuth, requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/user-role";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { AgentDashboardContent } from "@/components/admin/AgentDashboardContent";

export const metadata: Metadata = {
  title: "Tableau de bord Agent - Partners LLC",
  description: "Tableau de bord avec métriques et activités pour les agents",
};

export default async function AdminDashboardPage() {
  const user = await requireAdminAuth();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Tableau de bord Agent
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Vue d'ensemble de votre charge de travail et performance
            </p>
          </div>
          <AgentDashboardContent agentId={user.id} />
        </div>
      </div>
    </div>
  );
}
