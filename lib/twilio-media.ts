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
 * Envoyer un message avec un fichier média
 * IMPORTANT: Twilio Conversations nécessite une URL publique pour les médias
 *
 * Vous devez d'abord uploader le fichier sur un stockage (Supabase Storage, S3, etc.)
 * puis passer l'URL publique ici.
 */
export async function sendMessageWithMedia(
  conversationSid: string,
  body: string,
  mediaFile: Buffer,
  mediaContentType: string,
  mediaFilename: string,
  identity: string
): Promise<string> {
  const client = getTwilioClient();
  const serviceSid = getServiceSid();

  // TODO: Upload le fichier vers un stockage et obtenir une URL publique
  // Pour l'instant, on envoie juste le message texte sans le fichier
  console.warn(
    "[sendMessageWithMedia] Twilio Conversations nécessite une URL publique pour les médias.",
    "Le fichier n'a pas été envoyé. Implémentez l'upload vers Supabase Storage ou S3."
  );

  const message = await client.conversations.v1
    .services(serviceSid)
    .conversations(conversationSid)
    .messages.create({
      author: identity,
      body: body + " [Fichier: " + mediaFilename + "]",
    });

  return message.sid;
}

/**
 * Envoyer un message avec une URL média externe
 * Le fichier doit être hébergé sur votre serveur (URL publique)
 */
export async function sendMessageWithMediaUrl(
  conversationSid: string,
  body: string,
  mediaUrl: string,
  identity: string
): Promise<string> {
  const client = getTwilioClient();
  const serviceSid = getServiceSid();

  const message = await client.conversations.v1
    .services(serviceSid)
    .conversations(conversationSid)
    .messages.create({
      author: identity,
      body: body,
    });

  return message.sid;
}

/**
 * Récupérer les médias d'un message
 */
export async function getMessageMedia(
  conversationSid: string,
  messageSid: string
): Promise<
  Array<{ sid: string; contentType: string; size: number; url: string }>
> {
  const client = getTwilioClient();
  const serviceSid = getServiceSid();

  const media = await client.conversations.v1
    .services(serviceSid)
    .conversations(conversationSid)
    .messages(messageSid)
    .fetch();

  console.log(media, "media");

  return media.media;
}

/**
 * Types de contenu supportés
 */
export const SUPPORTED_MEDIA_TYPES = {
  // Images
  IMAGE_JPEG: "image/jpeg",
  IMAGE_PNG: "image/png",
  IMAGE_GIF: "image/gif",
  IMAGE_WEBP: "image/webp",

  // Documents
  PDF: "application/pdf",
  DOC: "application/msword",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Audio
  AUDIO_MP3: "audio/mpeg",
  AUDIO_WAV: "audio/wav",
  AUDIO_OGG: "audio/ogg",

  // Vidéo
  VIDEO_MP4: "video/mp4",
  VIDEO_WEBM: "video/webm",
};

/**
 * Valider la taille du fichier (max 150 MB)
 */
export function validateMediaSize(fileSize: number): boolean {
  const MAX_SIZE = 150 * 1024 * 1024; // 150 MB
  return fileSize <= MAX_SIZE;
}
