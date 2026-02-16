/**
 * Envoi d'emails via Resend (API).
 * Utilisé par l'app Next.js et aligné avec le helper Edge Function (Deno).
 * Pour les Supabase Edge Functions, voir supabase/functions/_shared/resend.ts
 */

import { Resend } from "resend";

export interface ResendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface ResendEmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

function getResendFrom(): string {
  // Resend attend "Nom <email@domaine.com>" (domaine vérifié dans le dashboard Resend)
  const name = process.env.NEXT_PUBLIC_APP_NAME || "Partners LLC";
  return process.env.RESEND_FROM || `${name} <noreply@partnersllc.com>`;
}

/**
 * Envoie un email via l'API Resend.
 * Utilise RESEND_API_KEY et RESEND_FROM (optionnel).
 */
export async function sendEmailWithResend(
  options: ResendEmailOptions
): Promise<ResendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const resend = new Resend(apiKey);
  const from = options.from || getResendFrom();

  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    throw new Error(error.message || "Resend send failed");
  }

  const messageId = data?.id ?? "";
  return {
    messageId,
    accepted: [options.to],
    rejected: [],
  };
}
