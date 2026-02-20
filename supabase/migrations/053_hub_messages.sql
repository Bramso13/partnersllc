-- =========================================================
-- PARTNERS HUB: MESSAGERIE (Story hub-messages)
-- =========================================================
-- Tables: hub_conversations, hub_messages
-- Fonction: get_hub_conversations_for_user (évite N+1)
-- RLS: chaque user voit uniquement ses conversations
-- Realtime: activé sur hub_messages pour le live chat
-- =========================================================

-- ── Tables ─────────────────────────────────────────────────

CREATE TABLE hub_conversations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- On normalise : participant_a_id < participant_b_id (UUID string sort)
  -- pour garantir l'unicité de la paire indépendamment de l'ordre
  participant_a_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT hub_conversations_unique_pair   UNIQUE (participant_a_id, participant_b_id),
  CONSTRAINT hub_conversations_no_self_chat  CHECK  (participant_a_id != participant_b_id),
  CONSTRAINT hub_conversations_pair_order    CHECK  (participant_a_id < participant_b_id)
);

CREATE TABLE hub_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES hub_conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX idx_hub_conversations_a       ON hub_conversations(participant_a_id);
CREATE INDEX idx_hub_conversations_b       ON hub_conversations(participant_b_id);
CREATE INDEX idx_hub_conversations_last    ON hub_conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_hub_messages_conv         ON hub_messages(conversation_id);
CREATE INDEX idx_hub_messages_conv_created ON hub_messages(conversation_id, created_at);
CREATE INDEX idx_hub_messages_unread       ON hub_messages(conversation_id, sender_id) WHERE read_at IS NULL;

-- ── Trigger : update last_message_at ───────────────────────

CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE hub_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_hub_messages_update_conversation
  AFTER INSERT ON hub_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message_at();

-- ── RLS ────────────────────────────────────────────────────

ALTER TABLE hub_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_messages      ENABLE ROW LEVEL SECURITY;

-- Conversations : un utilisateur voit uniquement celles où il participe
CREATE POLICY "User sees own conversations"
  ON hub_conversations FOR SELECT
  USING (participant_a_id = auth.uid() OR participant_b_id = auth.uid());

CREATE POLICY "Hub member can create conversation"
  ON hub_conversations FOR INSERT
  WITH CHECK (
    (participant_a_id = auth.uid() OR participant_b_id = auth.uid())
    AND is_hub_member(auth.uid())
  );

-- Messages : lecture uniquement dans ses propres conversations
CREATE POLICY "User sees messages in own conversations"
  ON hub_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM hub_conversations
      WHERE participant_a_id = auth.uid() OR participant_b_id = auth.uid()
    )
  );

CREATE POLICY "User can send message in own conversation"
  ON hub_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM hub_conversations
      WHERE participant_a_id = auth.uid() OR participant_b_id = auth.uid()
    )
  );

-- Seul le destinataire peut marquer un message comme lu
CREATE POLICY "Recipient can mark message as read"
  ON hub_messages FOR UPDATE
  USING (
    sender_id != auth.uid()
    AND conversation_id IN (
      SELECT id FROM hub_conversations
      WHERE participant_a_id = auth.uid() OR participant_b_id = auth.uid()
    )
  );

-- ── Fonction : conversations enrichies (évite N+1) ─────────

CREATE OR REPLACE FUNCTION get_hub_conversations_for_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.last_message_at DESC NULLS LAST)
  INTO result
  FROM (
    SELECT
      c.id,
      c.participant_a_id,
      c.participant_b_id,
      c.last_message_at,
      c.created_at,
      -- L'autre participant
      CASE WHEN c.participant_a_id = p_user_id
        THEN c.participant_b_id ELSE c.participant_a_id
      END AS other_user_id,
      mp.display_name  AS other_display_name,
      mp.avatar_url    AS other_avatar_url,
      mp.profession    AS other_profession,
      -- Dernier message
      (
        SELECT row_to_json(m)
        FROM (
          SELECT content, sender_id, created_at
          FROM hub_messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC
          LIMIT 1
        ) m
      ) AS last_message,
      -- Compteur de non-lus
      (
        SELECT COUNT(*)
        FROM hub_messages
        WHERE conversation_id = c.id
          AND sender_id != p_user_id
          AND read_at IS NULL
      ) AS unread_count
    FROM hub_conversations c
    LEFT JOIN hub_member_profiles mp
      ON mp.user_id = CASE
        WHEN c.participant_a_id = p_user_id THEN c.participant_b_id
        ELSE c.participant_a_id
      END
    WHERE c.participant_a_id = p_user_id
       OR c.participant_b_id = p_user_id
  ) t;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ── Realtime ───────────────────────────────────────────────
-- Activer la réplication sur hub_messages pour Supabase Realtime

ALTER PUBLICATION supabase_realtime ADD TABLE hub_messages;
