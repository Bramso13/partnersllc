import { requireAuth } from "@/lib/auth";
import { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  return {
    title: `Profil membre - PARTNERS Hub`,
    description: `Profil du membre ${userId}`,
  };
}

/**
 * Page profil public membre Hub.
 * Story 16.1 implémentera le contenu complet (GET /api/hub/members/[userId], sections, avatar, etc.).
 */
export default async function HubMemberProfilePage({ params }: PageProps) {
  await requireAuth();
  const { userId } = await params;

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/hub"
            className="text-brand-text-secondary hover:text-brand-accent transition-colors inline-flex items-center gap-2"
          >
            <i className="fa-solid fa-arrow-left" />
            Retour au Hub
          </Link>
        </div>
        <div className="bg-brand-dark-surface border border-brand-dark-border rounded-lg p-8 text-center">
          <p className="text-brand-text-secondary mb-4">
            Profil membre (Story 16.1)
          </p>
          <p className="text-sm text-brand-text-secondary font-mono">
            user_id: {userId}
          </p>
        </div>
      </div>
    </div>
  );
}
