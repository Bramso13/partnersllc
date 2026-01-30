import { requireAuth } from "@/lib/auth";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFormationWithElements,
  getUserProgress,
} from "@/lib/formations";
import { FormationParcours } from "@/components/dashboard/FormationParcours";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await requireAuth();

  const formation = await getFormationWithElements(id, true, profile.id);

  if (!formation) {
    return {
      title: "Formation introuvable - Partners LLC",
    };
  }

  return {
    title: `${formation.titre} - Formation - Partners LLC`,
    description: formation.description || "Formation Partners LLC",
  };
}

export default async function FormationDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await requireAuth();

  // Fetch formation with elements (checks access)
  const formation = await getFormationWithElements(id, true, profile.id);

  if (!formation) {
    notFound();
  }

  // Fetch user progress
  const progress = await getUserProgress(profile.id, id);

  return (
    <FormationParcours
      formation={formation}
      progress={progress}
      userId={profile.id}
    />
  );
}
