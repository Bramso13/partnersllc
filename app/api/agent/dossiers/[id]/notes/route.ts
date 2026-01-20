import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/agent/dossiers/[id]/notes
 * Recupere les notes internes d'un dossier
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    await requireAgentAuth();
    const supabase = createAdminClient();

    const { data: notes, error } = await supabase
      .from("dossier_notes")
      .select(
        `
        id,
        note_text,
        created_at,
        agent:agents (
          name
        )
      `
      )
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/agent/dossiers/notes] Error", error);
      return NextResponse.json(
        { error: "Erreur lors de la recuperation des notes" },
        { status: 500 }
      );
    }

    const transformedNotes = (notes || []).map((note) => {
      const agent = Array.isArray(note.agent) ? note.agent[0] : note.agent;
      return {
        id: note.id,
        content: note.note_text,
        created_at: note.created_at,
        agent_name: agent?.name || "Agent",
      };
    });

    return NextResponse.json({ notes: transformedNotes });
  } catch (error) {
    console.error("[GET /api/agent/dossiers/notes] Error", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/dossiers/[id]/notes
 * Ajoute une note interne a un dossier
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const user = await requireAgentAuth();
    const supabase = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Le contenu de la note est requis" },
        { status: 400 }
      );
    }

    // Get agent from email
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name")
      .eq("email", user.email)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent non trouve" },
        { status: 403 }
      );
    }

    // Verify dossier exists
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("id")
      .eq("id", dossierId)
      .single();

    if (dossierError || !dossier) {
      return NextResponse.json(
        { error: "Dossier non trouve" },
        { status: 404 }
      );
    }

    // Insert note
    const { data: note, error: insertError } = await supabase
      .from("dossier_notes")
      .insert({
        dossier_id: dossierId,
        agent_id: agent.id,
        note_text: content.trim(),
      })
      .select("id, note_text, created_at")
      .single();

    if (insertError) {
      console.error("[POST /api/agent/dossiers/notes] Insert error", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la creation de la note" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      note: {
        id: note.id,
        content: note.note_text,
        created_at: note.created_at,
        agent_name: agent.name,
      },
    });
  } catch (error) {
    console.error("[POST /api/agent/dossiers/notes] Error", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
