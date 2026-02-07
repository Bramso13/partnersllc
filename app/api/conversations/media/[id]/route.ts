import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * GET /api/conversations/media/[id]
 * Sert un fichier média de conversation avec vérification de permissions
 *
 * Permissions:
 * - Les participants de la conversation peuvent accéder
 * - Les admins peuvent accéder à tous les fichiers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Créer le client Supabase avec le contexte utilisateur
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    );

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Récupérer les métadonnées du fichier
    const { data: media, error: mediaError } = await supabase
      .from("conversation_media")
      .select(
        `
        *,
        conversation:twilio_conversations!conversation_id (
          id,
          type
        )
      `
      )
      .eq("id", id)
      .single();

    if (mediaError || !media) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Vérifier les permissions
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "ADMIN";

    if (!isAdmin) {
      // Vérifier si l'utilisateur est participant de la conversation
      const { data: participant } = await supabase
        .from("twilio_conversation_participants")
        .select("id")
        .eq("twilio_conversation_id", media.conversation_id)
        .eq("profile_id", user.id)
        .single();

      if (!participant) {
        return NextResponse.json(
          { error: "Access denied - you are not a participant of this conversation" },
          { status: 403 }
        );
      }
    }

    // Récupérer le fichier depuis Supabase Storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from("conversation-media")
      .download(media.file_path);

    if (storageError || !fileData) {
      console.error("[GET /api/conversations/media/:id] Storage error:", storageError);
      return NextResponse.json(
        { error: "Failed to retrieve file" },
        { status: 500 }
      );
    }

    // Convertir le Blob en ArrayBuffer puis Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Retourner le fichier avec les bons headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": media.content_type,
        "Content-Disposition": `inline; filename="${media.filename}"`,
        "Content-Length": media.file_size.toString(),
        "Cache-Control": "private, max-age=3600", // Cache 1h
      },
    });
  } catch (error) {
    console.error("[GET /api/conversations/media/:id] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
