import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/hub/signup/session?signup_session_id=xxx
 * Retourne les données de la session pour le récapitulatif (step4).
 */
export async function GET(request: NextRequest) {
  try {
    const signupSessionId = request.nextUrl.searchParams.get("signup_session_id");
    if (!signupSessionId?.trim()) {
      return NextResponse.json(
        { error: "signup_session_id requis" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: session, error } = await adminSupabase
      .from("hub_signup_sessions")
      .select("id, first_name, last_name, email, expires_at")
      .eq("id", signupSessionId.trim())
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: "Session d'inscription introuvable ou expirée" },
        { status: 404 }
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Session d'inscription expirée" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      first_name: session.first_name ?? null,
      last_name: session.last_name ?? null,
      email: session.email ?? null,
      country: null,
      profession: null,
    });
  } catch (err) {
    console.error("GET /api/hub/signup/session:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
