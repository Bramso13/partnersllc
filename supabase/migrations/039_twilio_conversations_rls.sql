-- =========================================================
-- RLS POLICIES: Twilio Conversations
-- Story 13.1: Twilio Conversations – Backend & modèle de données
-- =========================================================
-- Admin: full access to all conversations.
-- Client: SELECT only on conversations linked to their dossiers.
-- Agent: SELECT only on conversations where they are the agent or a participant.
-- =========================================================

-- Enable RLS
ALTER TABLE twilio_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE twilio_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE twilio_conversation_messages ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- twilio_conversations
-- =========================================================

-- Admins: full access
CREATE POLICY "twilio_conversations_admin_all"
  ON twilio_conversations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Clients: SELECT conversations where dossier belongs to them
CREATE POLICY "twilio_conversations_client_select"
  ON twilio_conversations FOR SELECT
  USING (
    type = 'client'
    AND dossier_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = twilio_conversations.dossier_id
        AND dossiers.user_id = auth.uid()
    )
  );

-- Agents: SELECT conversations where they are the agent
CREATE POLICY "twilio_conversations_agent_select"
  ON twilio_conversations FOR SELECT
  USING (
    agent_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM twilio_conversation_participants p
      WHERE p.twilio_conversation_id = twilio_conversations.id
        AND p.profile_id = auth.uid()
    )
  );

-- =========================================================
-- twilio_conversation_participants
-- =========================================================

-- Admins: full access
CREATE POLICY "twilio_participants_admin_all"
  ON twilio_conversation_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Clients: SELECT participants for their conversations
CREATE POLICY "twilio_participants_client_select"
  ON twilio_conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM twilio_conversations tc
      JOIN dossiers d ON d.id = tc.dossier_id
      WHERE tc.id = twilio_conversation_participants.twilio_conversation_id
        AND tc.type = 'client'
        AND d.user_id = auth.uid()
    )
  );

-- Agents: SELECT participants for their conversations
CREATE POLICY "twilio_participants_agent_select"
  ON twilio_conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM twilio_conversations tc
      WHERE tc.id = twilio_conversation_participants.twilio_conversation_id
        AND (
          tc.agent_profile_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM twilio_conversation_participants p2
            WHERE p2.twilio_conversation_id = tc.id
              AND p2.profile_id = auth.uid()
          )
        )
    )
  );

-- =========================================================
-- twilio_conversation_messages
-- =========================================================

-- Admins: full access
CREATE POLICY "twilio_messages_admin_all"
  ON twilio_conversation_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Clients: SELECT messages for their conversations
CREATE POLICY "twilio_messages_client_select"
  ON twilio_conversation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM twilio_conversations tc
      JOIN dossiers d ON d.id = tc.dossier_id
      WHERE tc.id = twilio_conversation_messages.twilio_conversation_id
        AND tc.type = 'client'
        AND d.user_id = auth.uid()
    )
  );

-- Agents: SELECT messages for their conversations
CREATE POLICY "twilio_messages_agent_select"
  ON twilio_conversation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM twilio_conversations tc
      WHERE tc.id = twilio_conversation_messages.twilio_conversation_id
        AND (
          tc.agent_profile_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM twilio_conversation_participants p
            WHERE p.twilio_conversation_id = tc.id
              AND p.profile_id = auth.uid()
          )
        )
    )
  );

-- =========================================================
-- SUCCESS
-- =========================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Twilio conversations RLS policies created successfully';
  RAISE NOTICE '  - Admin: full access on all 3 tables';
  RAISE NOTICE '  - Client: SELECT on conversations via dossier ownership';
  RAISE NOTICE '  - Agent: SELECT on conversations via agent_profile_id or participant';
END $$;
