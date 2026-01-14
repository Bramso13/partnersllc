import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch all notes for a dossier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAdminAuth();
    const { id: dossierId } = await params;

    const supabase = await createClient();

    // Fetch notes with user names (agents/admins)
    const { data: notes, error } = await supabase
      .from("dossier_notes")
      .select(
        `
        id,
        dossier_id,
        user_id,
        note_text,
        created_at,
        updated_at,
        user:user_id (
          full_name
        )
      `
      )
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      return NextResponse.json(
        { error: "Failed to fetch notes" },
        { status: 500 }
      );
    }

    // Transform data to include user_name at top level
    const transformedNotes = (notes || []).map((note: any) => ({
      id: note.id,
      dossier_id: note.dossier_id,
      user_id: note.user_id,
      note_text: note.note_text,
      created_at: note.created_at,
      updated_at: note.updated_at,
      user_name: note.user?.full_name || "Utilisateur inconnu",
    }));

    return NextResponse.json(transformedNotes);
  } catch (error) {
    console.error("Error in GET notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const user = await requireAdminAuth();
    const { id: dossierId } = await params;

    // Parse request body
    const body = await request.json();
    const { noteText } = body;

    if (!noteText || !noteText.trim()) {
      return NextResponse.json(
        { error: "Note text is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert note (user_id is automatically the authenticated user)
    const { data: note, error: insertError } = await supabase
      .from("dossier_notes")
      .insert({
        dossier_id: dossierId,
        user_id: user.id, // Use authenticated user's ID
        note_text: noteText.trim(),
      })
      .select(
        `
        id,
        dossier_id,
        user_id,
        note_text,
        created_at,
        updated_at,
        user:user_id (
          full_name
        )
      `
      )
      .single();

    if (insertError) {
      console.error("Error creating note:", insertError);
      return NextResponse.json(
        { error: "Failed to create note" },
        { status: 500 }
      );
    }

    // Transform response
    const transformedNote = {
      id: note.id,
      dossier_id: note.dossier_id,
      user_id: note.user_id,
      note_text: note.note_text,
      created_at: note.created_at,
      updated_at: note.updated_at,
      user_name: (note as any).user?.full_name || "Utilisateur inconnu",
    };

    return NextResponse.json(transformedNote);
  } catch (error) {
    console.error("Error in POST note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
