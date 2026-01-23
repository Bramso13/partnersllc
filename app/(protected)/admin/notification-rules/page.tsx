import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";
import { NotificationRulesContent } from "@/components/admin/notifications/NotificationRulesContent";

export const metadata: Metadata = {
  title: "Notification Rules - Partners LLC",
  description: "Gestion des règles de notification",
};

export default async function NotificationRulesPage() {
  await requireAdminAuth();

  return <NotificationRulesContent />;
}
