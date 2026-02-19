import { createAdminClient } from "@/lib/supabase/server";
import type { AdminConversationWithDossier } from "@/types/conversations";

export async function getConversationById(id: string): Promise<AdminConversationWithDossier | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("twilio_conversations")
    .select(`
      *,
      dossier:dossiers!dossier_id (
        id,
        user:profiles!user_id (id, full_name),
        product:products!product_id (id, name)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("[getConversationById]", error);
    return null;
  }

  return data as AdminConversationWithDossier;
}
