import { requireAuthWithProfile } from "@/lib/auth";
import { getRecentNotificationsServer } from "@/lib/notifications/in-app-server";
import { NotificationsPageContent } from "./NotificationsPageContent";

export const metadata = {
  title: "Notifications - Partners LLC",
  description: "Consultez toutes vos notifications",
};

export default async function NotificationsPage() {
  const profile = await requireAuthWithProfile();
  const initialNotifications = await getRecentNotificationsServer(
    profile.id,
    50
  );

  return (
    <div className="min-h-screen bg-[#2D3033]">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#F9F9F9]">
              Notifications
            </h1>
            <p className="text-[#B7B7B7] mt-1">
              Consultez toutes vos notifications et mises à jour
            </p>
          </div>

          <NotificationsPageContent
            initialNotifications={initialNotifications}
            userId={profile.id}
          />
        </div>
      </div>
    </div>
  );
}
