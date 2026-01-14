import { requireAuth } from "@/lib/auth";
import { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export const metadata: Metadata = {
  title: "Mon entreprise - Partners LLC",
  description: "Gérez les informations de votre entreprise",
};

export default async function EntreprisePage() {
  await requireAuth();

  return (
    <ComingSoon
      title="Mon entreprise"
      description="Cette section vous permettra de gérer toutes les informations relatives à votre entreprise, y compris les détails de votre LLC, les documents officiels et les informations de contact."
      icon="fa-building"
    />
  );
}
