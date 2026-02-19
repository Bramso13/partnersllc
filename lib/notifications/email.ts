import { sendEmailWithResend } from "./resend";

// =========================================================
// TYPES
// =========================================================

export type EmailTransport = "smtp" | "resend";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  /** Force le transport (pour les tests admin). Sinon : Resend si RESEND_API_KEY, sinon SMTP */
  transport?: EmailTransport;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export interface EmailError {
  message: string;
  code?: string;
  response?: string;
}

// =========================================================
// CONFIGURATION
// =========================================================

/**
 * Get SMTP configuration from environment variables
 */
function getSmtpConfig() {
  // const isTestMode = process.env.NODE_ENV === "development" && process.env.EMAIL_TEST_MODE === "true";

  // if (isTestMode) {
  //   // Use Ethereal for testing
  //   return {
  //     host: "smtp.ethereal.email",
  //     port: 587,
  //     secure: false,
  //     auth: {
  //       user: process.env.ETHEREAL_USER || "test@ethereal.email",
  //       pass: process.env.ETHEREAL_PASS || "test",
  //     },
  //   };
  // }

  // Production SMTP configuration
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };
}

/**
 * Get default from email address
 */
function getDefaultFrom(): string {
  return (
    process.env.SMTP_FROM || process.env.SMTP_USER || "contact@partnersllc.fr"
  );
}

// =========================================================
// EMAIL VALIDATION
// =========================================================

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// =========================================================
// RETRY LOGIC
// =========================================================

/**
 * Calculate delay for exponential backoff
 */
function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s
  return Math.pow(2, attempt) * 1000;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================================================
// SEND EMAIL
// =========================================================

/**
 * Send email with retry logic (up to 3 retries with exponential backoff).
 * Utilise Resend si RESEND_API_KEY est défini (ou si options.transport === 'resend'),
 * sinon SMTP (nodemailer). options.transport force le transport pour les tests.
 */
export async function sendEmail(
  options: EmailOptions,
  retryCount: number = 0
): Promise<EmailResult> {
  const maxRetries = 3;

  // Validate email address
  if (!isValidEmail(options.to)) {
    throw new Error(`Invalid email address: ${options.to}`);
  }

  // Validate required fields
  if (!options.subject || !options.html || !options.text) {
    throw new Error("Missing required email fields: subject, html, or text");
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set — cannot use Resend transport");
  }
  console.warn("Sending email with Resend");
  try {
    return await sendEmailWithResend({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      from: options.from,
      replyTo: options.replyTo,
    });
  } catch (error: any) {
    if (
      retryCount < maxRetries &&
      error?.message?.toLowerCase().includes("rate")
    ) {
      const delay = getRetryDelay(retryCount);
      await sleep(delay);
      return sendEmail(options, retryCount + 1);
    }
    throw error;
  }
}
