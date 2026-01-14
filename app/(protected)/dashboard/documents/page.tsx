import { requireAuth } from "@/lib/auth";
import { getUserDocuments } from "@/lib/documents";
import { Metadata } from "next";
import { Suspense } from "react";

import { DocumentsLoadingSkeleton } from "@/components/documents/DocumentsLoadingSkeleton";
import { DocumentsListContent } from "./DocumentsListContent";

export const metadata: Metadata = {
  title: "Vos Documents - Partners LLC",
  description: "Gérez et accédez à tous vos documents légaux et administratifs",
};

export default async function DocumentsPage() {
  await requireAuth();

  // Fetch all documents for the user (RLS enforced)
  const documents = await getUserDocuments();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<DocumentsLoadingSkeleton />}>
            <DocumentsListContent initialDocuments={documents} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
