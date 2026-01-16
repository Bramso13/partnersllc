import nodemailer, { Transporter } from "nodemailer";
import type { SentMessageInfo } from "nodemailer";

// =========================================================
// TYPES
// =========================================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
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
  const isTestMode = process.env.NODE_ENV === "development" && process.env.EMAIL_TEST_MODE === "true";

  if (isTestMode) {
    // Use Ethereal for testing
    return {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || "test@ethereal.email",
        pass: process.env.ETHEREAL_PASS || "test",
      },
    };
  }

  // Production SMTP configuration
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
}

/**
 * Get default from email address
 */
function getDefaultFrom(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@partnersllc.com";
}

// =========================================================
// TRANSPORTER
// =========================================================

let transporter: Transporter | null = null;

/**
 * Get or create nodemailer transporter
 */
function getTransporter(): Transporter {
  if (!transporter) {
    const config = getSmtpConfig();
    transporter = nodemailer.createTransport(config);
  }
  return transporter;
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    console.error("Email connection verification failed:", error);
    return false;
  }
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
 * Send email with retry logic (up to 3 retries with exponential backoff)
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

  try {
    const transport = getTransporter();
    const from = options.from || getDefaultFrom();

    const mailOptions = {
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    };

    const info: SentMessageInfo = await transport.sendMail(mailOptions);

    // Extract message ID from response
    const messageId = info.messageId || info.response?.split(" ")[2] || "";

    return {
      messageId,
      accepted: Array.isArray(info.accepted) ? info.accepted : [options.to],
      rejected: Array.isArray(info.rejected) ? info.rejected : [],
    };
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    const errorCode = error.code || "UNKNOWN";
    const errorResponse = error.response || "";

    // Retry on transient errors
    if (retryCount < maxRetries) {
      const isTransientError =
        errorCode === "ECONNECTION" ||
        errorCode === "ETIMEDOUT" ||
        errorCode === "EENVELOPE" ||
        errorResponse.includes("temporarily") ||
        errorResponse.includes("retry");

      if (isTransientError) {
        const delay = getRetryDelay(retryCount);
        console.warn(
          `Email send failed (attempt ${retryCount + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
          errorMessage
        );
        await sleep(delay);
        return sendEmail(options, retryCount + 1);
      }
    }

    // Max retries reached or non-retryable error
    const emailError: EmailError = {
      message: errorMessage,
      code: errorCode,
      response: errorResponse,
    };

    throw emailError;
  }
}

// =========================================================
// TEST MODE HELPERS
// =========================================================

/**
 * Create test account for Ethereal (development only)
 */
export async function createTestAccount(): Promise<{
  user: string;
  pass: string;
  smtp: { host: string; port: number; secure: boolean };
  web: string;
}> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Cannot create test account in production");
  }

  const testAccount = await nodemailer.createTestAccount();
  return {
    user: testAccount.user,
    pass: testAccount.pass,
    smtp: {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
    },
    web: testAccount.web,
  };
}
