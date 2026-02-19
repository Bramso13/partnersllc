import { requireAuth } from "@/lib/auth";
import { Metadata } from "next";
import Link from "next/link";
import { ConnectionSuggestions } from "@/components/hub/ConnectionSuggestions";

export const metadata: Metadata = {
  title: "Suggestions - PARTNERS Hub",
  description: "Membres que vous pourriez connaître",
};

export default async function HubSuggestionsPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/dashboard/hub"
            className="text-brand-text-secondary hover:text-brand-accent transition-colors"
            aria-label="Retour au Hub"
          >
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <h1 className="text-2xl font-bold text-brand-text-primary">
            Membres que vous pourriez connaître
          </h1>
        </div>
        <ConnectionSuggestions
          limit={10}
          showViewMore={false}
          title=""
        />
      </div>
    </div>
  );
}
