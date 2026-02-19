import { requireAuth } from "@/lib/auth";
import { Metadata } from "next";
import { HubSearchPageClient } from "./HubSearchPageClient";

export const metadata: Metadata = {
  title: "Recherche de membres | Partners Hub - Partners LLC",
  description:
    "Recherchez des membres du Partners Hub par pays, métier, expertise et langues.",
};

export default async function HubSearchPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-2">
          Rechercher des membres
        </h1>
        <p className="text-brand-text-secondary mb-6">
          Trouvez des profils pertinents pour vous connecter.
        </p>
        <HubSearchPageClient />
      </div>
    </div>
  );
}
