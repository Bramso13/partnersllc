import { requireAuth } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { getUserDossiers, getDossierAdvisor } from "@/lib/dossiers";
import { getProductSteps, ProductStep } from "@/lib/workflow";
import { Metadata } from "next";
import { Suspense } from "react";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { SidebarCards } from "@/components/dashboard/SidebarCards";
import { TimelineSection } from "@/components/dashboard/TimelineSection";
import { DocumentsSection } from "@/components/dashboard/DocumentsSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { isActiveUser, isPendingUser, isSuspendedUser } from "@/types/user";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PendingStatus } from "@/components/dashboard/PendingStatus";
import { SuspendedStatus } from "@/components/dashboard/SuspendedStatus";
import { ActiveStatus } from "@/components/dashboard/ActiveStatus";

export const metadata: Metadata = {
  title: "Tableau de bord - Partners LLC",
  description: "Votre tableau de bord Partners LLC",
};

export default async function DashboardPage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">
          Erreur: Profil utilisateur introuvable
        </p>
      </div>
    );
  }

  // If user is not active, show status-specific content
  if (isPendingUser(profile)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#F9F9F9]">
                Tableau de bord
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[#B7B7B7]">Bienvenue, {user.email}</p>
                <StatusBadge status={profile.status} />
              </div>
            </div>
          </div>
          <PendingStatus />
        </div>
      </div>
    );
  }

  if (isSuspendedUser(profile)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#F9F9F9]">
                Tableau de bord
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[#B7B7B7]">Bienvenue, {user.email}</p>
                <StatusBadge status={profile.status} />
              </div>
            </div>
          </div>
          <SuspendedStatus profile={profile} />
        </div>
      </div>
    );
  }

  // For active users, show the dossier dashboard
  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div id="welcome-header" className="mb-8">
            <h2 className="text-3xl font-bold text-brand-text-primary">
              Bonjour, {profile.full_name?.split(" ")[0] || "Utilisateur"} 👋
            </h2>
            <p className="text-brand-text-secondary mt-1">
              Voici le récapitulatif de la création de votre LLC.
            </p>
          </div>

          {/* Dashboard Content */}
          <Suspense fallback={<LoadingSkeleton />}>
            <DashboardContent user={user} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function DashboardContent({ user }: { user: { id: string } }) {
  try {
    const dossiers = await getUserDossiers();

    // If no dossier, show EmptyState to create one
    if (dossiers.length === 0) {
      return <EmptyState />;
    }

    // For now, show the first dossier (we can extend to show multiple later)
    const mainDossier = dossiers[0];

    // Fetch product steps for this dossier if product_id exists
    let productSteps: ProductStep[] = [];
    if (mainDossier.product_id) {
      try {
        productSteps = await getProductSteps(mainDossier.product_id);
        console.log(
          `[Dashboard] Loaded ${productSteps.length} product steps for product ${mainDossier.product_id}`
        );
      } catch (error) {
        console.error("Error fetching product steps:", error);
      }
    } else {
      console.warn(
        "[Dashboard] No product_id found for dossier",
        mainDossier.id
      );
    }

    // Calculate estimated completion (mock for now - should come from business logic)
    const estimatedCompletion = mainDossier.completed_at
      ? null
      : new Date(new Date(mainDossier.created_at).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();

    // Get advisor information
    const advisor = await getDossierAdvisor(mainDossier.id);

    return (
      <>
        {/* Link to dossier detail page */}
        <div className="mb-6 flex justify-end">
          <a
            href={`/dashboard/dossier/${mainDossier.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-dark-bg rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <span>Voir le détail du dossier</span>
            <i className="fa-solid fa-arrow-right"></i>
          </a>
        </div>

        {/* Progress Overview Section */}
        <div id="progress-overview" className="grid grid-cols-12 gap-6 mb-8">
          <ProgressCard dossier={mainDossier} productSteps={productSteps} />
          <SidebarCards
            estimatedCompletion={estimatedCompletion || undefined}
            advisor={advisor}
          />
        </div>

        {/* Main Grid Section */}
        <div id="main-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TimelineSection dossier={mainDossier} />
          {/* <DocumentsSection /> */}
        </div>
      </>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return <ErrorState />;
  }
}
