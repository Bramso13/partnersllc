import { createAdminClient } from "@/lib/supabase/server";
import type { TwilioConversationMessage } from "@/types/conversations";

export async function getConversationMessages(conversationId: string): Promise<TwilioConversationMessage[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("twilio_conversation_messages")
    .select("*")
    .eq("twilio_conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getConversationMessages]", error);
    return [];
  }

  return (data ?? []) as TwilioConversationMessage[];
}
