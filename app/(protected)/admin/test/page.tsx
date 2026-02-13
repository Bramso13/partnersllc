import { requireAdminAuth } from "@/lib/auth";
import { AdminTestContent } from "@/components/admin/test/AdminTestContent";

export const metadata = {
  title: "Test | Admin",
};

export default async function AdminTestPage() {
  await requireAdminAuth();

  return <AdminTestContent />;
}
