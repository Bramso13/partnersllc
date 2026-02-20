import { requireAdminAuth } from "@/lib/auth";
import { AdminHubEventsContent } from "@/components/admin/hub/AdminHubEventsContent";

export const metadata = {
  title: "Événements Hub | PARTNERS LLC Admin",
  description: "Création et gestion des événements de la communauté PartnersHub",
};

export default async function AdminHubEventsPage() {
  await requireAdminAuth();
  return <AdminHubEventsContent />;
}
