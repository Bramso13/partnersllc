import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";
import { AdminAcomptesContent } from "@/components/admin/acomptes/AdminAcomptesContent";

export const metadata: Metadata = {
  title: "Acomptes - Partners LLC Admin",
  description: "Gestion des acomptes et soldes",
};

export default async function AdminAcomptesPage() {
  await requireAdminAuth();
  return <AdminAcomptesContent />;
}
