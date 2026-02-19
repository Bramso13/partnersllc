import { notFound } from "next/navigation";
import { getHubUserIfMember } from "@/lib/hub-auth";
import { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { HubMemberProfileView } from "./HubMemberProfileView";

type Props = { params: Promise<{ userId: string }> };

async function getProfile(userId: string) {
  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "";
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/hub/members/${userId}`,
    { cache: "no-store", headers: { cookie } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getProfile(userId);
  if (!profile) return { title: "Profil - Partners Hub" };
  const name = profile.display_name || "Membre";
  const profession = profile.profession || "";
  return {
    title: `${name}${profession ? ` | ${profession}` : ""} - Partners Hub`,
    description: profession
      ? `Profil de ${name}, ${profession}`
      : `Profil de ${name} sur Partners Hub`,
  };
}

export default async function HubMemberProfilePage({ params }: Props) {
  const { userId } = await params;
  const hubUser = await getHubUserIfMember();
  if (!hubUser) notFound();

  const profile = await getProfile(userId);
  if (!profile) notFound();

  const isOwner = hubUser.userId === userId;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/hub"
            className="text-brand-accent hover:underline inline-flex items-center gap-2 text-sm"
          >
            <i className="fa-solid fa-arrow-left" />
            Retour au Hub
          </Link>
        </div>
        <HubMemberProfileView profile={profile} isOwner={isOwner} />
      </div>
    </div>
  );
}
