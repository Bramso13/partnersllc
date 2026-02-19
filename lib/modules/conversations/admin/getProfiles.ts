import { createAdminClient } from "@/lib/supabase/server";
import type { AdminProfileSummary } from "@/types/conversations";

export async function getProfilesByIds(ids: string[]): Promise<AdminProfileSummary[]> {
  if (ids.length === 0) return [];
  
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);

  if (error) {
    console.error("[getProfilesByIds]", error);
    return [];
  }

  return (data ?? []) as AdminProfileSummary[];
}

export async function getAllAdmins(): Promise<AdminProfileSummary[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "ADMIN");

  if (error) {
    console.error("[getAllAdmins]", error);
    return [];
  }

  return (data ?? []) as AdminProfileSummary[];
}
