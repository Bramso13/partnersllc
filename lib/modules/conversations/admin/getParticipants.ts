import { createAdminClient } from "@/lib/supabase/server";
import type { TwilioConversationParticipant } from "@/types/conversations";

export async function getConversationParticipants(conversationId: string): Promise<TwilioConversationParticipant[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("twilio_conversation_participants")
    .select("*")
    .eq("twilio_conversation_id", conversationId);

  if (error) {
    console.error("[getConversationParticipants]", error);
    return [];
  }

  return (data ?? []) as TwilioConversationParticipant[];
}
