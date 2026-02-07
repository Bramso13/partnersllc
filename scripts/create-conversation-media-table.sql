-- Table pour stocker les métadonnées des fichiers de conversations
-- Exécutez ce script dans l'éditeur SQL de Supabase

CREATE TABLE IF NOT EXISTS conversation_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence à la conversation
  conversation_id UUID NOT NULL REFERENCES twilio_conversations(id) ON DELETE CASCADE,

  -- Chemin du fichier dans Supabase Storage
  file_path TEXT NOT NULL,

  -- Métadonnées du fichier
  title TEXT NOT NULL,
  description TEXT,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,

  -- Qui a uploadé
  uploaded_by UUID NOT NULL REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_conversation_media_conversation_id
  ON conversation_media(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_media_uploaded_by
  ON conversation_media(uploaded_by);

-- RLS (Row Level Security)
ALTER TABLE conversation_media ENABLE ROW LEVEL SECURITY;

-- Politique : Les participants de la conversation peuvent lire les médias
CREATE POLICY "Participants can view media"
  ON conversation_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM twilio_conversation_participants tcp
      WHERE tcp.twilio_conversation_id = conversation_media.conversation_id
        AND tcp.profile_id = auth.uid()
    )
    OR
    -- Les admins peuvent tout voir
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Politique : Les utilisateurs authentifiés peuvent uploader
CREATE POLICY "Authenticated users can upload media"
  ON conversation_media FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND auth.role() = 'authenticated'
  );

-- Politique : L'uploader ou les admins peuvent supprimer
CREATE POLICY "Owner or admin can delete media"
  ON conversation_media FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_conversation_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_media_updated_at
  BEFORE UPDATE ON conversation_media
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_media_updated_at();

COMMENT ON TABLE conversation_media IS 'Métadonnées des fichiers envoyés dans les conversations Twilio';
