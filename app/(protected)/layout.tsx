import { requireAuthWithProfile } from "@/lib/auth";
import { getNavConfigForRole } from "@/lib/navigation-config";
import { SidebarProvider } from "@/components/sidebar/SidebarProvider";
import { Toaster } from "sonner";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuthWithProfile();
  const navConfig = getNavConfigForRole(profile.role);

  return (
    <SidebarProvider role={profile.role} navConfig={navConfig}>
      {children}
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}
