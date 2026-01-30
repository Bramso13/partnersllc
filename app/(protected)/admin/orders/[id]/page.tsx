import { requireAdminAuth } from "@/lib/auth";
import { Metadata } from "next";
import { AdminOrderDetailContent } from "@/components/admin/orders/AdminOrderDetailContent";

export const metadata: Metadata = {
  title: "Détail commande - Partners LLC Admin",
  description: "Détail de la commande et gestion des paiements",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  await requireAdminAuth();
  const { id } = await params;
  return <AdminOrderDetailContent orderId={id} />;
}
