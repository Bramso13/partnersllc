export type TwilioConversationType = "client" | "agent";

export type TwilioConversation = {
  id: string;
  twilio_conversation_sid: string;
  twilio_service_sid: string;
  type: TwilioConversationType;
  dossier_id: string | null;
  agent_profile_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TwilioConversationParticipant = {
  id: string;
  twilio_conversation_id: string;
  profile_id: string;
  twilio_participant_sid: string | null;
  role: "admin";
  created_at: string;
};

export type TwilioMessageSenderType = "admin" | "client" | "agent";

export type TwilioConversationMessage = {
  id: string;
  twilio_conversation_id: string;
  twilio_message_sid: string | null;
  sender_type: TwilioMessageSenderType;
  sender_profile_id: string | null;
  body: string;
  dossier_id: string | null;
  created_at: string;
};

// API request/response types

export type CreateConversationRequest = {
  type: TwilioConversationType;
  dossier_id?: string;
  agent_profile_id?: string;
};

export type SendMessageRequest = {
  body: string;
  dossier_id?: string;
};

export type AddParticipantRequest = {
  profile_id: string;
};

export type ConversationDetailResponse = {
  conversation: TwilioConversation;
  participants: TwilioConversationParticipant[];
  messages: TwilioConversationMessage[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
  };
};

// Client-facing conversation summary (GET /api/conversations)
export type ClientConversationSummary = {
  id: string;
  dossier_id: string;
  dossier_label: string;
  last_activity: string | null;
};

// Admin enriched types for list and detail views
export type AdminConversationWithDossier = TwilioConversation & {
  dossier: {
    id: string;
    user: { id: string; full_name: string; email: string } | null;
    product: { id: string; name: string } | null;
  } | null;
};

export type DossierForNewConversation = {
  id: string;
  clientName: string;
  productName: string;
};

export type AdminProfileSummary = {
  id: string;
  full_name: string;
  email: string;
};
