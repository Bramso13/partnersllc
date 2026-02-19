import { requireAdminAuth } from "@/lib/auth";
import { AdminHubSubscriptionsContent } from "@/components/admin/hub/AdminHubSubscriptionsContent";

export const metadata = {
  title: "Inscriptions Hub | PARTNERS LLC Admin",
  description: "Vue et gestion des inscriptions et abonnements Partners Hub",
};

export default async function AdminHubSubscriptionsPage() {
  await requireAdminAuth();
  return <AdminHubSubscriptionsContent />;
}
