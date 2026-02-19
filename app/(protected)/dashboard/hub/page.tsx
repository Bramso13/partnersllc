import { requireAuth } from "@/lib/auth";
import { getHubUserIfMember } from "@/lib/hub-auth";
import { Metadata } from "next";
import Link from "next/link";
import { ConnectionSuggestions } from "@/components/hub/ConnectionSuggestions";

export const metadata: Metadata = {
  title: "PARTNERS Hub - Partners LLC",
  description: "Accédez à la communauté PARTNERS",
};

export default async function HubPage() {
  await requireAuth();
  const hubUser = await getHubUserIfMember();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {hubUser && (
          <div className="mb-6 flex justify-end">
            <Link
              href="/hub/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-dark-bg font-semibold rounded-lg hover:opacity-90"
            >
              <i className="fa-solid fa-user-pen" />
              Mon profil
            </Link>
          </div>
        )}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-brand-text-primary">
            PARTNERS Hub
          </h1>
          <p className="text-brand-text-secondary mt-2">
            Rejoignez la communauté pour échanger avec d&apos;autres entrepreneurs et accéder à des ressources exclusives.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <main className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-brand-dark-border bg-brand-dark-surface p-6">
              <p className="text-brand-text-secondary">
                Carte mondiale et recherche avancée à venir (Epic 15 / 16.2).
              </p>
              <Link
                href="/dashboard/hub/suggestions"
                className="mt-4 inline-flex items-center gap-2 text-brand-accent hover:underline"
              >
                Voir les suggestions de connexions
                <i className="fa-solid fa-arrow-right text-sm" />
              </Link>
            </div>
          </main>
          <aside className="lg:col-span-1">
            <ConnectionSuggestions limit={5} showViewMore={true} />
          </aside>
        </div>
      </div>
    </div>
  );
}
