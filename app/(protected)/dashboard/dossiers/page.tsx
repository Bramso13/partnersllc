import { requireAuth } from "@/lib/auth";
import { getUserDossiers } from "@/lib/dossiers";
import { Metadata } from "next";
import { Suspense } from "react";

import { DossiersLoadingSkeleton } from "@/components/dossiers/DossiersLoadingSkeleton";
import { DossiersListContent } from "./DossiersListContent";

export const metadata: Metadata = {
  title: "Mes dossiers - Partners LLC",
  description: "Gérez tous vos dossiers de services d'affaires",
};

export default async function DossiersListPage() {
  await requireAuth();

  // Fetch all dossiers for the user (RLS enforced)
  const dossiers = await getUserDossiers();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<DossiersLoadingSkeleton />}>
            <DossiersListContent initialDossiers={dossiers} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
