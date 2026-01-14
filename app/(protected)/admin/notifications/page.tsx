import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications - Partners LLC",
  description: "Gestion des notifications",
};

export default async function NotificationsPage() {
  await requireAdminAuth();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Notifications
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Gestion et configuration des notifications système
            </p>
          </div>
          <div className="bg-brand-card-bg rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <i className="fa-solid fa-bullhorn text-6xl text-brand-text-secondary"></i>
              </div>
              <h2 className="text-2xl font-semibold text-brand-text-primary mb-2">
                En cours de développement
              </h2>
              <p className="text-brand-text-secondary">
                Cette fonctionnalité sera bientôt disponible. Elle vous permettra
                de gérer et configurer les notifications système pour vos clients
                et agents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
