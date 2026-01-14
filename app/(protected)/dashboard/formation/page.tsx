import { requireAuth } from "@/lib/auth";
import { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export const metadata: Metadata = {
  title: "Formation - Partners LLC",
  description: "Accédez à nos formations et ressources éducatives",
};

export default async function FormationPage() {
  await requireAuth();

  return (
    <ComingSoon
      title="Formation"
      description="Accédez à des formations complètes sur la gestion d'entreprise, la comptabilité, le marketing et bien plus encore pour développer vos compétences entrepreneuriales."
      icon="fa-graduation-cap"
    />
  );
}
