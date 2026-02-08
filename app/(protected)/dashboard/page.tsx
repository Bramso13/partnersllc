import { requireAuth } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { getUserDossiers, getDossierAdvisor } from "@/lib/dossiers";
import { getProductSteps, ProductStep } from "@/lib/workflow";
import { getUserOrders } from "@/lib/orders";
import { getDeliveredDocuments } from "@/lib/documents";
import { syncPaymentStatus } from "@/lib/sync-payment-status";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DossierAccordion } from "@/components/dashboard/DossierAccordion";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { DeliveredDocuments } from "@/components/dashboard/DeliveredDocuments";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { needsPayment } from "@/types/orders";
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
  const initialProfile = await getProfile(user.id);

  if (!initialProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">
          Erreur: Profil utilisateur introuvable
        </p>
      </div>
    );
  }

  // For PENDING or SUSPENDED users, sync payment status with Stripe first
  let profile = initialProfile;
  if (isPendingUser(initialProfile) || isSuspendedUser(initialProfile)) {
    try {
      const syncResult = await syncPaymentStatus(user.id);
      if (syncResult.synced > 0) {
        console.log(
          `[Dashboard] Synced ${syncResult.synced} payment(s) for user ${user.id}`
        );
        // Re-fetch profile to get updated status
        const updatedProfile = await getProfile(user.id);
        if (updatedProfile) {
          profile = updatedProfile;
        }
      }
      if (syncResult.errors.length > 0) {
        console.error("[Dashboard] Payment sync errors:", syncResult.errors);
      }
    } catch (error) {
      console.error("[Dashboard] Error syncing payment status:", error);
      // Continue anyway - don't block the dashboard
    }
  }

  // If user is still not active after sync, show status-specific content
  if (isPendingUser(profile)) {
    const orders = await getUserOrders();
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
          <PendingStatus orders={orders} />
        </div>
      </div>
    );
  }

  if (isSuspendedUser(profile)) {
    const orders = await getUserOrders();
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
          <SuspendedStatus profile={profile} orders={orders} />
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

          {/* Explainer Video Section */}
          <div className="mb-10 group">
            <div className="bg-gradient-to-br from-brand-accent/5 via-transparent to-brand-accent/5 rounded-3xl p-6 border border-brand-accent/10 backdrop-blur-sm transition-all duration-500 hover:border-brand-accent/30 hover:shadow-2xl hover:shadow-brand-accent/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-accent/20 blur-xl rounded-full animate-pulse"></div>
                  <i className="fa-solid fa-circle-play text-brand-accent text-2xl relative z-10"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-brand-text-primary">
                    Comment utiliser votre tableau de bord
                  </h3>
                  <p className="text-sm text-brand-text-secondary/80">
                    Découvrez en 2 minutes comment naviguer dans votre espace
                  </p>
                </div>
              </div>

              <div
                className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/5 transition-all duration-500 group-hover:ring-brand-accent/30 group-hover:shadow-brand-accent/10"
                style={{ paddingBottom: "56.25%" }}
              >
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/lEfnI2KXgO4"
                  title="Guide du tableau de bord Partners LLC"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    border: "none",
                  }}
                ></iframe>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-brand-text-secondary/60">
                <i className="fa-solid fa-lightbulb text-brand-accent/70"></i>
                <p>
                  Astuce : Regardez cette vidéo pour comprendre toutes les
                  fonctionnalités ci-dessous
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <Suspense fallback={<LoadingSkeleton />}>
            <DashboardContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function DashboardContent() {
  try {
    // Fetch dossiers, orders, and delivered documents in parallel
    const [dossiers, orders, deliveredDocuments] = await Promise.all([
      getUserDossiers(),
      getUserOrders(),
      getDeliveredDocuments(),
    ]);

    // Filter unpaid orders (PENDING/FAILED)
    const unpaidOrders = orders.filter(needsPayment);

    // If no dossier, no unpaid orders, and no delivered documents, show EmptyState
    if (
      dossiers.length === 0 &&
      unpaidOrders.length === 0 &&
      deliveredDocuments.length === 0
    ) {
      return <EmptyState />;
    }

    // Fetch product steps and advisor for each dossier
    const dossiersData = await Promise.all(
      dossiers.map(async (dossier) => {
        let productSteps: ProductStep[] = [];
        if (dossier.product_id) {
          try {
            productSteps = await getProductSteps(dossier.product_id);
          } catch (error) {
            console.error(
              `Error fetching product steps for dossier ${dossier.id}:`,
              error
            );
          }
        }

        const advisor = await getDossierAdvisor(dossier.id);

        return {
          dossier,
          productSteps,
          advisor: advisor || undefined,
        };
      })
    );

    const firstDossierId =
      dossiersData.length > 0 ? dossiersData[0].dossier.id : null;

    return (
      <div className="space-y-8">
        {/* CTA: Démarrer la création de votre LLC */}
        {firstDossierId && (
          <div className="rounded-2xl bg-gradient-to-r from-brand-accent/20 via-brand-accent/10 to-brand-accent/20 border border-brand-accent/30 p-6 shadow-lg shadow-brand-accent/10">
            <Link
              href={`/dashboard/dossier/${firstDossierId}`}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-brand-accent text-brand-dark-bg font-semibold text-lg hover:bg-brand-accent/90 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-dark-bg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <i className="fa-solid fa-rocket text-xl" aria-hidden />
              <span>Démarrer la création de votre LLC</span>
              <i className="fa-solid fa-arrow-right text-lg" aria-hidden />
            </Link>
          </div>
        )}

        {/* Unpaid Orders Section */}
        {unpaidOrders.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <i className="fa-solid fa-credit-card text-brand-warning text-xl"></i>
              <h3 className="text-lg font-semibold text-brand-text-primary">
                Commandes en attente de paiement
              </h3>
              <span className="bg-brand-warning/10 text-brand-warning px-2 py-0.5 rounded-full text-sm font-medium">
                {unpaidOrders.length}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {unpaidOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Delivered Documents Section */}
        {deliveredDocuments.length > 0 && (
          <DeliveredDocuments documents={deliveredDocuments} />
        )}

        {/* Dossiers Section */}
        {dossiersData.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <i className="fa-solid fa-folder-open text-brand-accent text-xl"></i>
              <h3 className="text-lg font-semibold text-brand-text-primary">
                Mes dossiers
              </h3>
              <span className="bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full text-sm font-medium">
                {dossiersData.length}
              </span>
            </div>
            <DossierAccordion dossiers={dossiersData} />
          </div>
        )}

        {/* If only unpaid orders and no dossiers */}
        {dossiersData.length === 0 &&
          unpaidOrders.length > 0 &&
          deliveredDocuments.length === 0 && (
            <div className="bg-brand-dark-bg rounded-2xl p-6 text-center">
              <i className="fa-solid fa-info-circle text-brand-text-secondary text-3xl mb-3"></i>
              <p className="text-brand-text-secondary">
                Complétez vos paiements pour créer vos dossiers et commencer vos
                démarches.
              </p>
            </div>
          )}
      </div>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return <ErrorState />;
  }
}
