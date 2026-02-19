import { createAdminClient } from "@/lib/supabase/server";

interface DossierStatusHistory {
  id: string;
  dossier_id: string;
  old_status: string | null;
  new_status: string;
  changed_by_type: string | null;
  changed_by_id: string | null;
  reason: string | null;
  created_at: string;
}

export async function getStatusHistory(dossierId: string): Promise<DossierStatusHistory[]> {
  const supabase = createAdminClient();

  const { data: history, error } = await supabase
    .from("dossier_status_history")
    .select(
      `
      id,
      old_status,
      new_status,
      changed_by_type,
      changed_by_id,
      reason,
      created_at
    `
    )
    .eq("dossier_id", dossierId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getStatusHistory] Error:", error);
    throw error;
  }

  return (history ?? []) as DossierStatusHistory[];
}
