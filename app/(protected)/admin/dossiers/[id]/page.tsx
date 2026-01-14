import { requireAdminAuth, requireAgentAuth } from "@/lib/auth";
import { getAdminDossierById } from "@/lib/dossiers";
import { getProductSteps, ProductStep } from "@/lib/workflow";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminDossierDetailContent } from "./AdminDossierDetailContent";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";

export const metadata: Metadata = {
  title: "Détail Dossier - Agent - Partners LLC",
  description: "Vue détaillée du dossier pour les agents",
};

export default async function AdminDossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAuth();
  const { id } = await params;

  // Fetch dossier (agents can see all dossiers)
  const dossier = await getAdminDossierById(id);

  if (!dossier) {
    notFound();
  }

  // Fetch product steps if product_id exists
  let productSteps: ProductStep[] = [];
  if (dossier.product_id) {
    try {
      productSteps = await getProductSteps(dossier.product_id);
    } catch (error) {
      console.error("Error fetching product steps:", error);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<LoadingSkeleton />}>
            <AdminDossierDetailContent
              dossier={dossier}
              productSteps={productSteps}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
