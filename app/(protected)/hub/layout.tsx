import { requireHubAuth } from "@/lib/hub-auth";

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireHubAuth();
  return <>{children}</>;
}
