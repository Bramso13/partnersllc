import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth";
import { sendEmail } from "@/lib/notifications/email";

const SendTestEmailSchema = z.object({
  to: z.string().email("Email destinataire invalide"),
  subject: z.string().min(1, "Sujet requis"),
  html: z.string().min(1, "Contenu HTML requis"),
  text: z.string().optional(),
  from: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  /** "resend" | "smtp" — force le transport pour les tests admin */
  transport: z.enum(["resend", "smtp"]).optional(),
});

export type SendTestEmailBody = z.infer<typeof SendTestEmailSchema>;

/**
 * POST /api/admin/test/email
 * Envoie un email de test via Resend (ou SMTP si RESEND_API_KEY absent).
 * Réservé aux admins.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const parseResult = SendTestEmailSchema.safeParse(body);
  if (!parseResult.success) {
    const first = parseResult.error.issues[0];
    const message = first?.message ?? "Données invalides";
    return NextResponse.json(
      { error: message, details: parseResult.error.issues },
      { status: 400 }
    );
  }

  const { to, subject, html, text, from, replyTo, transport } = parseResult.data;

  try {
    const result = await sendEmail({
      to,
      subject,
      html,
      text: text ?? (html.replace(/<[^>]*>/g, "").trim() || "(no plain text)"),
      from,
      replyTo,
      transport,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'envoi";
    console.error("[POST /api/admin/test/email]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
