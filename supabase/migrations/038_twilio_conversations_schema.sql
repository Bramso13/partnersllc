-- =========================================================
-- TWILIO CONVERSATIONS SCHEMA
-- Story 13.1: Twilio Conversations – Backend & modèle de données
-- =========================================================
-- Tables for persisting Twilio Conversations (WhatsApp) linked
-- to dossiers (client conversations) or agents (agent conversations).
-- =========================================================

-- =========================================================
-- TABLE: twilio_conversations
-- =========================================================
-- Each row represents a Twilio Conversation created on the platform.
-- type='client' → linked to a dossier (dossier_id required).
-- type='agent'  → linked to an agent (agent_profile_id required).
CREATE TABLE IF NOT EXISTS twilio_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_conversation_sid text NOT NULL UNIQUE,
  twilio_service_sid text NOT NULL,

  -- 'client' = conversation with a client via their dossier
  -- 'agent'  = conversation with an agent
  type text NOT NULL CHECK (type IN ('client', 'agent')),

  -- FK: required when type = 'client'
  dossier_id uuid REFERENCES dossiers(id) ON DELETE SET NULL,

  -- FK: required when type = 'agent' (points to profiles, not agents table)
  agent_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Enforce: client → dossier_id required; agent → agent_profile_id required
  CONSTRAINT twilio_conversations_type_check CHECK (
    (type = 'client' AND dossier_id IS NOT NULL) OR
    (type = 'agent' AND agent_profile_id IS NOT NULL)
  )
);

CREATE INDEX idx_twilio_conversations_type ON twilio_conversations(type);
CREATE INDEX idx_twilio_conversations_dossier ON twilio_conversations(dossier_id);
CREATE INDEX idx_twilio_conversations_agent ON twilio_conversations(agent_profile_id);
CREATE INDEX idx_twilio_conversations_sid ON twilio_conversations(twilio_conversation_sid);

COMMENT ON TABLE twilio_conversations IS 'Twilio Conversations linked to dossiers (client) or agents';
COMMENT ON COLUMN twilio_conversations.twilio_conversation_sid IS 'Twilio-side Conversation SID';
COMMENT ON COLUMN twilio_conversations.twilio_service_sid IS 'Twilio Conversation Service SID used';
COMMENT ON COLUMN twilio_conversations.type IS 'client = linked to a dossier; agent = linked to an agent profile';
COMMENT ON COLUMN twilio_conversations.dossier_id IS 'Required for type=client; the dossier this conversation belongs to';
COMMENT ON COLUMN twilio_conversations.agent_profile_id IS 'Required for type=agent; the agent profile this conversation targets';

-- =========================================================
-- TABLE: twilio_conversation_participants
-- =========================================================
-- Tracks admin participants added to a Twilio conversation.
-- Multiple admins can be participants in a single conversation.
CREATE TABLE IF NOT EXISTS twilio_conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_conversation_id uuid NOT NULL REFERENCES twilio_conversations(id) ON DELETE CASCADE,

  -- The admin profile added to this conversation
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Twilio Participant SID (nullable until synced with Twilio)
  twilio_participant_sid text,

  -- Currently only 'admin' participants are tracked here
  role text NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),

  created_at timestamptz NOT NULL DEFAULT now(),

  -- One admin can appear once per conversation
  CONSTRAINT twilio_conversation_participants_unique
    UNIQUE (twilio_conversation_id, profile_id)
);

CREATE INDEX idx_twilio_participants_conversation ON twilio_conversation_participants(twilio_conversation_id);
CREATE INDEX idx_twilio_participants_profile ON twilio_conversation_participants(profile_id);

COMMENT ON TABLE twilio_conversation_participants IS 'Admin participants in a Twilio conversation';
COMMENT ON COLUMN twilio_conversation_participants.twilio_participant_sid IS 'Twilio Participant SID (null until added on Twilio side)';
COMMENT ON COLUMN twilio_conversation_participants.profile_id IS 'Admin profile added as participant';

-- =========================================================
-- TABLE: twilio_conversation_messages
-- =========================================================
-- Persists all messages in a Twilio conversation (both sent and received).
CREATE TABLE IF NOT EXISTS twilio_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_conversation_id uuid NOT NULL REFERENCES twilio_conversations(id) ON DELETE CASCADE,

  -- Twilio Message SID (nullable for platform-sent messages before API response)
  twilio_message_sid text,

  -- Who sent this message
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'client', 'agent')),

  -- Profile ID of the sender (nullable for external clients without a profile match)
  sender_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Message body
  body text NOT NULL,

  -- Optional link to a dossier (for agent conversations where message relates to a dossier)
  dossier_id uuid REFERENCES dossiers(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Primary query pattern: fetch messages for a conversation ordered by time
CREATE INDEX idx_twilio_messages_conversation_created
  ON twilio_conversation_messages(twilio_conversation_id, created_at);
CREATE INDEX idx_twilio_messages_sid ON twilio_conversation_messages(twilio_message_sid);

COMMENT ON TABLE twilio_conversation_messages IS 'Messages persisted from Twilio Conversations (sent and received)';
COMMENT ON COLUMN twilio_conversation_messages.twilio_message_sid IS 'Twilio Message SID (null until confirmed by Twilio API)';
COMMENT ON COLUMN twilio_conversation_messages.sender_type IS 'admin | client | agent';
COMMENT ON COLUMN twilio_conversation_messages.sender_profile_id IS 'Sender profile (nullable for external client messages)';
COMMENT ON COLUMN twilio_conversation_messages.dossier_id IS 'Optional dossier link (used for agent conversations)';

-- =========================================================
-- TRIGGER: Auto-update updated_at on twilio_conversations
-- =========================================================
CREATE OR REPLACE FUNCTION update_twilio_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER twilio_conversations_updated_at
  BEFORE UPDATE ON twilio_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_twilio_conversations_updated_at();

-- =========================================================
-- SUCCESS
-- =========================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Twilio conversations schema created successfully';
  RAISE NOTICE '  - twilio_conversations (client/agent conversations)';
  RAISE NOTICE '  - twilio_conversation_participants (admin participants)';
  RAISE NOTICE '  - twilio_conversation_messages (persisted messages)';
END $$;
