import { requireAdminAuth } from "@/lib/auth";
import { getAllAdminDossiers } from "@/lib/dossiers";
import { AdminDossiersListContent } from "@/components/admin/dossiers/AdminDossiersListContent";

export const metadata = {
  title: "Dossiers LLC | PARTNERS LLC Admin",
  description: "Liste de tous les dossiers LLC du système",
};

export default async function AdminDossiersPage() {
  console.log("🔍 [AdminDossiersPage] Starting...");
  await requireAdminAuth();
  console.log("✅ [AdminDossiersPage] Admin auth passed");

  console.log("🔍 [AdminDossiersPage] Fetching dossiers...");
  const dossiers = await getAllAdminDossiers();
  console.log("✅ [AdminDossiersPage] Dossiers fetched:", dossiers.length);

  return <AdminDossiersListContent initialDossiers={dossiers} />;
}
