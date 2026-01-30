import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";
import { AdminOrdersContent } from "@/components/admin/orders/AdminOrdersContent";

export const metadata: Metadata = {
  title: "Commandes - Partners LLC Admin",
  description: "Liste des commandes et gestion des paiements",
};

export default async function AdminOrdersPage() {
  await requireAdminAuth();
  return <AdminOrdersContent />;
}
