import { createAdminClient } from "@/lib/supabase/server";
import type { AdminConversationWithDossier, DossierForNewConversation } from "@/types/conversations";

export async function getAllClientConversations(): Promise<AdminConversationWithDossier[]> {
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
    .eq("type", "client")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getAllClientConversations]", error);
    return [];
  }

  return (data ?? []) as AdminConversationWithDossier[];
}

export async function getDossiersForNewConversation(): Promise<DossierForNewConversation[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dossiers")
    .select(`
      id,
      user:profiles!user_id (full_name),
      product:products!product_id (name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getDossiersForNewConversation]", error);
    return [];
  }

  type RawDossier = {
    id: string;
    user?: { full_name?: string } | { full_name?: string }[] | null;
    product?: { name?: string } | { name?: string }[] | null;
  };

  const raw = (data ?? []) as RawDossier[];
  return raw.map((d) => {
    const user = Array.isArray(d.user) ? d.user[0] : d.user;
    const product = Array.isArray(d.product) ? d.product[0] : d.product;
    return {
      id: d.id,
      clientName: user?.full_name ?? "Client inconnu",
      productName: product?.name ?? "Produit inconnu",
    };
  });
}
