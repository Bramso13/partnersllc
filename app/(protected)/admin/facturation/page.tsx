import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facturation - Partners LLC",
  description: "Gestion de la facturation",
};

export default async function FacturationPage() {
  await requireAdminAuth();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Facturation
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Gestion de la facturation et des paiements
            </p>
          </div>
          <div className="bg-brand-card-bg rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <i className="fa-solid fa-file-invoice-dollar text-6xl text-brand-text-secondary"></i>
              </div>
              <h2 className="text-2xl font-semibold text-brand-text-primary mb-2">
                En cours de développement
              </h2>
              <p className="text-brand-text-secondary">
                Cette fonctionnalité sera bientôt disponible. Elle vous permettra
                de gérer la facturation et les paiements de vos clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
