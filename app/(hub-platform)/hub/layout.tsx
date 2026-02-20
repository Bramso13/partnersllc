import { requireHubAuth } from "@/lib/hub-auth";

export default async function HubPlatformRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireHubAuth();
  return <>{children}</>;
}
