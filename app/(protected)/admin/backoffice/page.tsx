import { requireAdminAuth } from "@/lib/auth";
import { AdminBackofficeContent } from "@/components/admin/backoffice/AdminBackofficeContent";

export const metadata = {
  title: "Back-office Données | Admin",
};

export default async function BackofficePage() {
  await requireAdminAuth();

  return <AdminBackofficeContent />;
}
