import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";
import { AdminNotificationsContent } from "@/components/admin/notifications/AdminNotificationsContent";

export const metadata: Metadata = {
  title: "Notifications - Partners LLC",
  description: "Gestion des notifications",
};

export default async function NotificationsPage() {
  await requireAdminAuth();

  return <AdminNotificationsContent />;
}
