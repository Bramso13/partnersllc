import { requireAdminAuth, requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/user-role";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { AnalyticsDashboardContent } from "@/components/admin/analytics/AnalyticsDashboardContent";

export const metadata: Metadata = {
  title: "Analytics Dashboard - Partners LLC",
  description:
    "Comprehensive analytics for revenue, conversion, and performance",
};

export default async function AdminAnalyticsPage() {
  const user = await requireAdminAuth();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Analyses & Statistiques
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Suivez la performance de votre activité en temps réel
            </p>
          </div>
          <AnalyticsDashboardContent />
        </div>
      </div>
    </div>
  );
}
