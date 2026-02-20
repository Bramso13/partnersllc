export interface HubConversation {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
  other_user_id: string;
  other_display_name: string | null;
  other_avatar_url: string | null;
  other_profession: string | null;
  last_message: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface HubMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface ConversationsResponse {
  conversations: HubConversation[];
}

export interface MessagesResponse {
  messages: HubMessage[];
  conversation: HubConversation;
}

export interface SendMessageBody {
  content: string;
}

export interface GetOrCreateConversationBody {
  other_user_id: string;
}
