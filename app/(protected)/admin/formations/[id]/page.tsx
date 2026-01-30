import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";
import { Suspense } from "react";
import { FormationEditContent } from "@/components/admin/formations/FormationEditContent";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";

export const metadata: Metadata = {
  title: "Éditer Formation - Partners LLC",
  description: "Créer ou modifier une formation",
};

export default async function FormationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAuth();
  const { id } = await params;

  // If id is "new", we're creating a new formation
  const isNew = id === "new";

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<LoadingSkeleton />}>
            <FormationEditContent formationId={isNew ? null : id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
