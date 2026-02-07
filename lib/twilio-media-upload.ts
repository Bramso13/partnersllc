/**
 * Upload de fichiers sécurisé pour Twilio Conversations
 * Les fichiers sont stockés dans Supabase Storage (bucket privé)
 * et servis via notre API avec vérification de permissions
 */

import { createClient } from "@supabase/supabase-js";
import Twilio from "twilio";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not configured`);
  }
  return value;
}

function getTwilioClient(): Twilio.Twilio {
  return Twilio(getEnv("TWILIO_ACCOUNT_SID"), getEnv("TWILIO_AUTH_TOKEN"));
}

function getServiceSid(): string {
  return getEnv("TWILIO_CONVERSATION_SERVICE_SID");
}

/**
 * Nettoie le nom de fichier pour le rendre compatible avec Supabase Storage
 */
function sanitizeFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";

  const cleanName = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return cleanName + ext.toLowerCase();
}

/**
 * Upload un fichier et stocke les métadonnées
 */
async function uploadFileToStorage(
  file: Buffer,
  filename: string,
  contentType: string,
  conversationId: string,
  uploadedBy: string,
  title: string,
  description?: string
): Promise<{ mediaId: string; filePath: string }> {
  const supabase = createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const bucket = "conversation-media";
  const cleanFilename = sanitizeFilename(filename);
  const path = `${Date.now()}-${cleanFilename}`;

  console.log("[uploadFileToStorage] Uploading to:", path);

  // Upload vers Storage (bucket PRIVÉ)
  const { error: storageError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (storageError) {
    throw new Error(`Failed to upload file: ${storageError.message}`);
  }

  // Stocker les métadonnées dans la table
  const { data: media, error: dbError } = await supabase
    .from("conversation_media")
    .insert({
      conversation_id: conversationId,
      file_path: path,
      title,
      description,
      filename: cleanFilename,
      content_type: contentType,
      file_size: file.length,
      uploaded_by: uploadedBy,
    })
    .select("id")
    .single();

  if (dbError || !media) {
    // Nettoyer le fichier uploadé si l'insertion DB échoue
    await supabase.storage.from(bucket).remove([path]);
    throw new Error(`Failed to save media metadata: ${dbError?.message}`);
  }

  return {
    mediaId: media.id,
    filePath: path,
  };
}

/**
 * Envoyer un message avec fichier via Twilio Conversations
 * Le fichier est servi via notre API sécurisée
 */
export async function sendMessageWithMedia(
  conversationSid: string,
  conversationId: string,
  body: string,
  mediaFile: Buffer,
  mediaContentType: string,
  mediaFilename: string,
  identity: string,
  title?: string,
  description?: string
): Promise<{ messageSid: string; mediaId: string; mediaUrl: string }> {
  console.log("[sendMessageWithMedia] Uploading file...");

  // 1. Upload vers Storage + sauvegarde métadonnées
  const { mediaId } = await uploadFileToStorage(
    mediaFile,
    mediaFilename,
    mediaContentType,
    conversationId,
    identity,
    title || mediaFilename,
    description
  );

  // 2. Générer l'URL sécurisée vers notre page (pas l'API directement)
  const appUrl = getEnv("NEXT_PUBLIC_APP_URL");
  const mediaUrl = `${appUrl}/conversations/media/${mediaId}`;

  console.log("[sendMessageWithMedia] Secure page URL:", mediaUrl);

  // 3. Envoyer le message avec l'URL sécurisée
  const client = getTwilioClient();
  const serviceSid = getServiceSid();

  const messageBody = body
    ? `${body}\n\n📎 ${title || mediaFilename}\n${mediaUrl}`
    : `📎 ${title || mediaFilename}\n${mediaUrl}`;

  const message = await client.conversations.v1
    .services(serviceSid)
    .conversations(conversationSid)
    .messages.create({
      author: identity,
      body: messageBody,
      attributes: JSON.stringify({
        mediaId,
        mediaUrl,
        mediaFilename,
        mediaContentType,
      }),
    });

  console.log("[sendMessageWithMedia] Message sent:", message.sid);

  return {
    messageSid: message.sid,
    mediaId,
    mediaUrl,
  };
}

/**
 * Valider la taille du fichier (max 150 MB)
 */
export function validateMediaSize(fileSize: number): boolean {
  const MAX_SIZE = 150 * 1024 * 1024; // 150 MB
  return fileSize <= MAX_SIZE;
}
