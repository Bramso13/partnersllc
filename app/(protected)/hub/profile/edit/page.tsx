import { notFound } from "next/navigation";
import { requireHubAuth } from "@/lib/hub-auth";
import { headers } from "next/headers";
import { Metadata } from "next";
import Link from "next/link";
import { EditProfileForm } from "./EditProfileForm";

export const metadata: Metadata = {
  title: "Modifier mon profil - Partners Hub",
  description: "Modifiez votre profil Partners Hub",
};

async function getMyProfile(userId: string) {
  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "";
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/hub/members/${userId}`,
    { cache: "no-store", headers: { cookie } }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function EditProfilePage() {
  const { userId } = await requireHubAuth();
  const profile = await getMyProfile(userId);
  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/hub/members/${userId}`}
            className="text-brand-accent hover:underline inline-flex items-center gap-2 text-sm"
          >
            <i className="fa-solid fa-arrow-left" />
            Retour au profil
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Modifier mon profil
        </h1>
        <EditProfileForm profile={profile} userId={userId} />
      </div>
    </div>
  );
}
