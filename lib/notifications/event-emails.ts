/**
 * Envoi d'emails déclenchés par les événements (MANUAL_CLIENT_CREATED, DOCUMENT_UPLOADED).
 * Toujours envoyés via Nodemailer (SMTP) comme demandé.
 */

import { sendEmail } from "./email";
import { generateSetPasswordEmail } from "./email-templates";
import { generateDocumentWaitingForClientEmail } from "./email-templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function dossierUrl(dossierId: string): string {
  return `${APP_URL}/dashboard/dossier/${dossierId}`;
}

/**
 * Envoie l'email "création de compte manuelle" avec lien pour définir le mot de passe (Supabase).
 * À appeler après l'insert de l'événement MANUAL_CLIENT_CREATED.
 */
export async function sendManualClientCreatedEmail(params: {
  to: string;
  userName: string;
  setPasswordUrl: string;
  productName?: string;
}): Promise<void> {
  const { html, text } = generateSetPasswordEmail({
    userName: params.userName,
    setPasswordUrl: params.setPasswordUrl,
    productName: params.productName,
  });
  await sendEmail(
    {
      to: params.to,
      subject: "Votre compte Partners LLC — Choisissez votre mot de passe",
      html,
      text,
      transport: "smtp",
    }
  );
}

/**
 * Envoie l'email "un document vous attend" au client quand admin/agent a déposé un document.
 * À appeler après l'insert de l'événement DOCUMENT_UPLOADED (source admin/agent).
 */
export async function sendDocumentWaitingForClientEmail(params: {
  to: string;
  userName: string;
  dossierId: string;
}): Promise<void> {
  const { html, text } = generateDocumentWaitingForClientEmail({
    userName: params.userName,
    dossierUrl: dossierUrl(params.dossierId),
  });
  await sendEmail(
    {
      to: params.to,
      subject: "Un document vous attend sur votre dossier — Partners LLC",
      html,
      text,
      transport: "smtp",
    }
  );
}
