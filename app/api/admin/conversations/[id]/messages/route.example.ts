/**
 * EXEMPLE d'API route pour envoyer des messages avec fichiers
 *
 * Renommez en route.ts pour l'utiliser
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { sendMessageWithMedia, validateMediaSize } from "@/lib/twilio-media";
import { sendTwilioMessage } from "@/lib/twilio";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminProfile = await requireAdminAuth();
    const conversationSid = params.id;

    const formData = await request.formData();
    const body = formData.get("body") as string;
    const file = formData.get("file") as File | null;

    if (!body && !file) {
      return NextResponse.json(
        { error: "Body or file is required" },
        { status: 400 }
      );
    }

    // Si pas de fichier, envoyer juste le texte
    if (!file) {
      const messageSid = await sendTwilioMessage(
        conversationSid,
        body,
        adminProfile.id
      );
      return NextResponse.json({ messageSid }, { status: 201 });
    }

    // Avec fichier
    // Valider la taille
    if (!validateMediaSize(file.size)) {
      return NextResponse.json(
        { error: "File size exceeds 150 MB limit" },
        { status: 400 }
      );
    }

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Envoyer le message avec média
    const messageSid = await sendMessageWithMedia(
      conversationSid,
      body || "📎 Fichier envoyé",
      buffer,
      file.type,
      file.name,
      adminProfile.id
    );

    return NextResponse.json(
      {
        messageSid,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[POST /api/admin/conversations/:id/messages]", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
