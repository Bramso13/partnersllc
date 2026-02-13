// =========================================================
// WHATSAPP SERVICE — via Twilio Messages API + Content Templates
// =========================================================

import Twilio from "twilio";

// =========================================================
// TYPES
// =========================================================

export interface WhatsAppOptions {
  to: string;
  message?: string; // kept for interface compatibility — ignored when using content template
  contentVariables?: Record<string, string>; // optional template variable overrides
}

export interface WhatsAppResult {
  messageId: string;
  status: string;
}

export interface WhatsAppError {
  message: string;
  code?: string;
  response?: string;
}

// =========================================================
// CONFIGURATION
// =========================================================

const WHATSAPP_TEMPLATE_SID =
  process.env.TWILIO_WHATSAPP_TEMPLATE_SID || "HX0145e679df838543ba4566830b435755";

function getTwilioClient(): Twilio.Twilio {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw {
      message: "Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)",
      code: "CONFIG_ERROR",
    } as WhatsAppError;
  }
  return Twilio(accountSid, authToken);
}

function getWhatsAppFrom(): string {
  const num = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!num) {
    throw {
      message: "TWILIO_WHATSAPP_NUMBER not configured",
      code: "CONFIG_ERROR",
    } as WhatsAppError;
  }
  // ensure whatsapp: prefix
  return num.startsWith("whatsapp:") ? num : `whatsapp:${num}`;
}

// =========================================================
// PHONE NUMBER VALIDATION
// =========================================================

/**
 * Validate and format phone number to E.164 format
 * E.164 format: +[country code][number] (e.g., +33612345678)
 */
export function formatToE164(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with +, keep it; otherwise, assume it needs + prefix
  if (!cleaned.startsWith("+")) {
    // If starts with 00, replace with +
    if (cleaned.startsWith("00")) {
      cleaned = "+" + cleaned.slice(2);
    } else {
      cleaned = "+" + cleaned;
    }
  }

  // Basic E.164 validation: + followed by 7-15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Check if phone number is valid E.164 format
 */
export function isValidE164(phone: string): boolean {
  return formatToE164(phone) !== null;
}

// =========================================================
// RETRY LOGIC
// =========================================================

function getRetryDelay(attempt: number): number {
  return Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================================================
// SEND WHATSAPP MESSAGE
// =========================================================

/**
 * Send a WhatsApp message via Twilio Messages API using a Content Template.
 * The `message` field in options is ignored — content is defined by the template.
 */
export async function sendWhatsAppMessage(
  options: WhatsAppOptions,
  retryCount: number = 0
): Promise<WhatsAppResult> {
  const maxRetries = 3;

  const formattedPhone = formatToE164(options.to);
  if (!formattedPhone) {
    throw {
      message: `Invalid phone number format: ${options.to}`,
      code: "INVALID_PHONE",
    } as WhatsAppError;
  }

  try {
    const client = getTwilioClient();
    const from = getWhatsAppFrom();
    const to = `whatsapp:${formattedPhone}`;

    const createParams: Parameters<typeof client.messages.create>[0] = {
      from,
      to,
      contentSid: WHATSAPP_TEMPLATE_SID,
    };

    if (options.contentVariables && Object.keys(options.contentVariables).length > 0) {
      createParams.contentVariables = JSON.stringify(options.contentVariables);
    }

    const message = await client.messages.create(createParams);

    return {
      messageId: message.sid,
      status: message.status,
    };
  } catch (error: any) {
    // Twilio SDK errors have a numeric `status` field for HTTP status
    const httpStatus: number = error.status ?? 0;
    const isRetryable =
      httpStatus >= 500 ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT";

    if (retryCount < maxRetries && isRetryable) {
      const delay = getRetryDelay(retryCount);
      console.warn(
        `WhatsApp send failed (attempt ${retryCount + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
        error.message
      );
      await sleep(delay);
      return sendWhatsAppMessage(options, retryCount + 1);
    }

    // Normalize to WhatsAppError
    if (error.message && (error.code !== undefined || error.response !== undefined)) {
      throw {
        message: error.message,
        code: error.code !== undefined ? String(error.code) : undefined,
        response: error.moreInfo || error.detail || undefined,
      } as WhatsAppError;
    }

    throw {
      message: error.message || "Unknown error sending WhatsApp message",
      code: "UNKNOWN",
    } as WhatsAppError;
  }
}

// =========================================================
// WHATSAPP MESSAGE TEMPLATES (kept for compatibility)
// =========================================================

export function generateStepCompletedWhatsApp(data: {
  stepName: string;
  dossierId: string;
  nextStepName?: string;
  dossierUrl: string;
}): string {
  const nextStepText = data.nextStepName
    ? `\n\nProchaine étape : ${data.nextStepName}`
    : "\n\nVotre dossier est maintenant complet !";

  return `✅ Étape terminée\n\nL'étape "${data.stepName}" de votre dossier a été terminée avec succès.${nextStepText}\n\nConsultez votre dossier : ${data.dossierUrl}`;
}
