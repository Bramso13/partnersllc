import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";
import { NotificationsProvider } from "@/lib/contexts/notifications/NotificationsContext";
import { NotificationRulesContent } from "@/components/admin/notifications/NotificationRulesContent";

export const metadata: Metadata = {
  title: "Notification Rules - Partners LLC",
  description: "Gestion des règles de notification",
};

export default async function NotificationRulesPage() {
  await requireAdminAuth();

  return (
    <NotificationsProvider>
      <NotificationRulesContent />
    </NotificationsProvider>
  );
}
