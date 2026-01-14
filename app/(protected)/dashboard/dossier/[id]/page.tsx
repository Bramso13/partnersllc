import { requireAuth } from "@/lib/auth";
import { getDossierById } from "@/lib/dossiers";
import { getProductSteps, ProductStep } from "@/lib/workflow";
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { DossierDetailContent } from "./DossierDetailContent";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";

export const metadata: Metadata = {
  title: "Dossier - Partners LLC",
  description: "Détail de votre dossier LLC",
};

export default async function DossierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step_id?: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const { step_id } = await searchParams;

  // Fetch dossier
  const dossier = await getDossierById(id);

  if (!dossier) {
    notFound();
  }

  // Verify ownership
  if (dossier.user_id !== user.id) {
    redirect("/dashboard");
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
            <DossierDetailContent
              dossier={dossier}
              productSteps={productSteps}
              initialStepId={step_id}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
