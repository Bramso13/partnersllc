import { requireHubAuth } from "@/lib/hub-auth";
import { HubSidebarProvider } from "@/components/hub/HubSidebarProvider";
import { HubProviders } from "@/components/hub/HubProviders";
import { Toaster } from "sonner";

export default async function HubAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await requireHubAuth();

  return (
    <HubProviders>
      <HubSidebarProvider userId={userId}>
        {children}
        <Toaster position="top-right" richColors />
      </HubSidebarProvider>
    </HubProviders>
  );
}
