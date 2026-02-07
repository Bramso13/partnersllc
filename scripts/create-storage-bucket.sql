-- Créer le bucket PRIVÉ pour les fichiers de conversations
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- IMPORTANT: Bucket PRIVÉ pour la sécurité
-- Les fichiers sont servis via /api/conversations/media/[id] avec vérification de permissions

-- Créer le bucket PRIVÉ (public = false)
INSERT INTO storage.buckets (id, name, public)
VALUES ('conversation-media', 'conversation-media', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Politique : Service Role peut uploader (pour l'API)
CREATE POLICY "Service can manage files"
ON storage.objects FOR ALL
USING ( bucket_id = 'conversation-media' );

-- Note: Pas de politique publique car tout passe par l'API
-- L'authentification et les permissions sont gérées au niveau application
