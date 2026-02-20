import type { Metadata } from "next";
import { Suspense } from "react";
import { requireHubAuth } from "@/lib/hub-auth";
import { MessagesUI } from "@/components/hub/messages/MessagesUI";

export const metadata: Metadata = {
  title: "Messages | Partners Hub",
  description: "Messagerie privée Partners Hub",
};

export default async function HubMessagesPage() {
  const { userId } = await requireHubAuth();

  return (
    <Suspense fallback={null}>
      <MessagesUI currentUserId={userId} />
    </Suspense>
  );
}
