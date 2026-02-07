import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import type {
  AdminConversationWithDossier,
  TwilioConversationMessage,
  TwilioConversationParticipant,
  AdminProfileSummary,
} from "@/types/conversations";
import { ConversationDetailContent } from "@/components/admin/conversations/ConversationDetailContent";

export const metadata: Metadata = {
  title: "Conversation - Partners LLC",
};

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAuth();

  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch conversation with dossier/client/product enrichment
  const { data: rawConversation } = await supabase
    .from("twilio_conversations")
    .select(
      `
      *,
      dossier:dossiers!dossier_id (
        id,
        user:profiles!user_id (id, full_name),
        product:products!product_id (id, name)
      )
    `
    )
    .eq("id", id)
    .single();

  if (!rawConversation) {
    return (
      <div className="min-h-screen bg-brand-dark-bg flex items-center justify-center">
        <div className="text-brand-text-secondary">
          Conversation non trouvée
        </div>
      </div>
    );
  }

  const conversation = rawConversation as AdminConversationWithDossier;

  // Fetch messages (chronological)
  const { data: rawMessages } = await supabase
    .from("twilio_conversation_messages")
    .select("*")
    .eq("twilio_conversation_id", id)
    .order("created_at", { ascending: true });

  const messages = (rawMessages ?? []) as TwilioConversationMessage[];

  // Fetch participants
  const { data: rawParticipants } = await supabase
    .from("twilio_conversation_participants")
    .select("*")
    .eq("twilio_conversation_id", id);

  const participants = (rawParticipants ??
    []) as TwilioConversationParticipant[];

  // Resolve admin profile names for message senders and participants
  const adminSenderIds = [
    ...new Set(
      messages
        .filter((m) => m.sender_type === "admin" && m.sender_profile_id)
        .map((m) => m.sender_profile_id!)
    ),
  ];
  const participantProfileIds = participants.map((p) => p.profile_id);
  const allProfileIds = [
    ...new Set([...adminSenderIds, ...participantProfileIds]),
  ];

  let adminProfiles: AdminProfileSummary[] = [];
  if (allProfileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", allProfileIds);
    adminProfiles = (profiles ?? []) as AdminProfileSummary[];
  }

  // Fetch all admin profiles for the "add participant" selector
  const { data: allAdminsRaw } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "ADMIN");

  const allAdmins = (allAdminsRaw ?? []) as AdminProfileSummary[];

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <ConversationDetailContent
            conversation={conversation}
            initialMessages={messages}
            participants={participants}
            adminProfiles={adminProfiles}
            allAdmins={allAdmins}
          />
        </div>
      </div>
    </div>
  );
}
