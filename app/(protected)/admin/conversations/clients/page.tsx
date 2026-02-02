import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import type {
  AdminConversationWithDossier,
  DossierForNewConversation,
} from "@/types/conversations";
import { ConversationsClientsContent } from "@/components/admin/conversations/ConversationsClientsContent";

export const metadata: Metadata = {
  title: "Conversations Clients - Partners LLC",
  description: "Gérer les conversations WhatsApp avec les clients",
};

export default async function ConversationsClientsPage() {
  await requireAdminAuth();

  const supabase = createAdminClient();

  // Fetch client conversations with dossier/client/product enrichment
  const { data: rawConversations } = await supabase
    .from("twilio_conversations")
    .select(
      `
      *,
      dossier:dossiers!dossier_id (
        id,
        user:profiles!user_id (id, full_name, email),
        product:products!product_id (id, name)
      )
    `
    )
    .eq("type", "client")
    .order("updated_at", { ascending: false });

  const conversations =
    (rawConversations as AdminConversationWithDossier[]) ?? [];

  // Fetch dossiers for the "new conversation" modal
  const { data: rawDossiers } = await supabase
    .from("dossiers")
    .select(
      `
      id,
      user:profiles!user_id (full_name),
      product:products!product_id (name)
    `
    )
    .order("created_at", { ascending: false });

  type RawDossier = {
    id: string;
    user?: { full_name?: string } | { full_name?: string }[] | null;
    product?: { name?: string } | { name?: string }[] | null;
  };
  const raw = (rawDossiers ?? []) as RawDossier[];
  const dossiers: DossierForNewConversation[] = raw.map((d) => {
    const user = Array.isArray(d.user) ? d.user[0] : d.user;
    const product = Array.isArray(d.product) ? d.product[0] : d.product;
    return {
      id: d.id,
      clientName: user?.full_name ?? "Client inconnu",
      productName: product?.name ?? "Produit inconnu",
    };
  });

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Conversations
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Gérer les conversations WhatsApp avec les clients et les agents
            </p>
          </div>
          <ConversationsClientsContent
            initialConversations={conversations}
            dossiers={dossiers}
          />
        </div>
      </div>
    </div>
  );
}
