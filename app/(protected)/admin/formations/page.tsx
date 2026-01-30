import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";
import { FormationsListContent } from "@/components/admin/formations/FormationsListContent";

export const metadata: Metadata = {
  title: "Gestion des Formations - Partners LLC",
  description: "Créer et gérer les formations et parcours pour les clients",
};

export default async function FormationsPage() {
  await requireAdminAuth();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Gestion des Formations
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Créer et gérer les formations et parcours de formation pour les clients
            </p>
          </div>
          <FormationsListContent />
        </div>
      </div>
    </div>
  );
}
