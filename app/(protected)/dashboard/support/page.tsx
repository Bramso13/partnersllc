import { requireAuth } from "@/lib/auth";
import { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export const metadata: Metadata = {
  title: "Support - Partners LLC",
  description: "Obtenez de l'aide et contactez notre équipe support",
};

export default async function SupportPage() {
  await requireAuth();

  return (
    <ComingSoon
      title="Support"
      description="Notre centre d'aide et de support sera bientôt disponible. Vous pourrez y trouver des réponses à vos questions, contacter notre équipe et accéder à des tutoriels."
      icon="fa-headset"
    />
  );
}
