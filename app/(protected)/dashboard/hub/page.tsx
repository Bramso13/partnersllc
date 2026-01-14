import { requireAuth } from "@/lib/auth";
import { Metadata } from "next";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export const metadata: Metadata = {
  title: "PARTNERS Hub - Partners LLC",
  description: "Accédez à la communauté PARTNERS",
};

export default async function HubPage() {
  await requireAuth();

  return (
    <ComingSoon
      title="PARTNERS Hub"
      description="Rejoignez la communauté PARTNERS Hub pour échanger avec d'autres entrepreneurs, partager vos expériences et accéder à des ressources exclusives."
      icon="fa-users"
    />
  );
}
