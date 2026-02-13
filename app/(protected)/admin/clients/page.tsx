import { requireAdminAuth } from "@/lib/auth";
import { ClientsProvider } from "@/lib/contexts/clients/ClientsContext";
import { AdminClientsContent } from "@/components/admin/clients/AdminClientsContent";

export const metadata = {
  title: "Gestion Clients | PARTNERS LLC Admin",
  description: "Vue d'ensemble et gestion des clients",
};

export default async function AdminClientsPage() {
  await requireAdminAuth();

  return (
    <ClientsProvider>
      <AdminClientsContent />
    </ClientsProvider>
  );
}
