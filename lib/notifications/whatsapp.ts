// =========================================================
// WHATSAPP SERVICE
// =========================================================

// =========================================================
// TYPES
// =========================================================

export interface WhatsAppOptions {
  to: string;
  message: string;
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

function getWhatsAppConfig() {
  return {
    apiUrl: process.env.WHATSAPP_API_URL || "https://api.whatsapp.com",
    apiToken: process.env.WHATSAPP_API_TOKEN,
  };
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
      // Assume it's missing the + prefix
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
  // Exponential backoff: 1s, 2s, 4s
  return Math.pow(2, attempt) * 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================================================
// SEND WHATSAPP MESSAGE
// =========================================================

/**
 * Send WhatsApp message with retry logic
 */
export async function sendWhatsAppMessage(
  options: WhatsAppOptions,
  retryCount: number = 0
): Promise<WhatsAppResult> {
  const maxRetries = 3;
  const config = getWhatsAppConfig();

  // Validate and format phone number
  const formattedPhone = formatToE164(options.to);
  if (!formattedPhone) {
    throw {
      message: `Invalid phone number format: ${options.to}`,
      code: "INVALID_PHONE",
    } as WhatsAppError;
  }

  // Check API token
  if (!config.apiToken) {
    throw {
      message: "WhatsApp API token not configured",
      code: "CONFIG_ERROR",
    } as WhatsAppError;
  }

  try {
    // WhatsApp Business API call
    const response = await fetch(`${config.apiUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "text",
        text: {
          preview_url: true,
          body: options.message,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}`;

      // Check if retryable
      if (retryCount < maxRetries && response.status >= 500) {
        const delay = getRetryDelay(retryCount);
        console.warn(
          `WhatsApp send failed (attempt ${retryCount + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
          errorMessage
        );
        await sleep(delay);
        return sendWhatsAppMessage(options, retryCount + 1);
      }

      throw {
        message: errorMessage,
        code: `HTTP_${response.status}`,
        response: JSON.stringify(errorData),
      } as WhatsAppError;
    }

    const data = await response.json();
    return {
      messageId: data.messages?.[0]?.id || data.id || "",
      status: data.messages?.[0]?.message_status || "sent",
    };
  } catch (error: any) {
    // Handle network errors
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      if (retryCount < maxRetries) {
        const delay = getRetryDelay(retryCount);
        console.warn(
          `WhatsApp connection failed (attempt ${retryCount + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
          error.message
        );
        await sleep(delay);
        return sendWhatsAppMessage(options, retryCount + 1);
      }
    }

    // Re-throw WhatsAppError as-is
    if (error.message && (error.code || error.response)) {
      throw error;
    }

    // Wrap other errors
    throw {
      message: error.message || "Unknown error sending WhatsApp message",
      code: error.code || "UNKNOWN",
      response: error.response,
    } as WhatsAppError;
  }
}

// =========================================================
// WHATSAPP MESSAGE TEMPLATES
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

  return `✅ Étape terminée

L'étape "${data.stepName}" de votre dossier a été terminée avec succès.${nextStepText}

Consultez votre dossier : ${data.dossierUrl}`;
}
