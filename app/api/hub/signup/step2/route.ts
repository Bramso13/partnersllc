import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  step2NewUserSchema,
  step2LlcClientSchema,
} from "@/lib/validation/hub-signup-schemas";
import { hashPassword } from "@/lib/auth/password-hash";
import { cookies } from "next/headers";

const SIGNUP_SESSION_HEADER = "x-signup-session-id";
const SIGNUP_SESSION_COOKIE = "signup_session_id";

function getSignupSessionId(request: NextRequest): string | null {
  const header = request.headers.get(SIGNUP_SESSION_HEADER);
  if (header) return header.trim();
  return null;
}

async function getSignupSessionIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SIGNUP_SESSION_COOKIE);
  return cookie?.value?.trim() ?? null;
}

/**
 * POST /api/hub/signup/step2
 * Body: { first_name, last_name, email, password?, phone? }
 * Header ou cookie: signup_session_id
 * - Si client LLC: pas de password, email doit correspondre à la session.
 * - Si nouveau: password requis, email unique.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId =
      getSignupSessionId(request) ?? (await getSignupSessionIdFromCookie());
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session d'inscription manquante (signup_session_id)" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body JSON invalide" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: session, error: sessionError } = await adminSupabase
      .from("hub_signup_sessions")
      .select("id, account_type, email, is_llc_client, existing_user_id, expires_at")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
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

    const isLlcClient = session.is_llc_client === true;

    if (isLlcClient) {
      const parsed = step2LlcClientSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.message, details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const { first_name, last_name, email, phone } = parsed.data;
      if (session.email && email.toLowerCase() !== session.email.toLowerCase()) {
        return NextResponse.json(
          {
            error:
              "L'email doit correspondre à celui utilisé pour identifier votre compte client",
          },
          { status: 400 }
        );
      }

      const { error: updateError } = await adminSupabase
        .from("hub_signup_sessions")
        .update({
          first_name,
          last_name,
          email: email.toLowerCase(),
          phone: phone || null,
          updated_at: now,
        })
        .eq("id", sessionId);

      if (updateError) {
        console.error("hub signup step2 update session:", updateError);
        return NextResponse.json(
          { error: "Erreur lors de la mise à jour de la session" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        next_step: "step3",
      });
    }

    const parsed = step2NewUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message, details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { first_name, last_name, email, password, phone } = parsed.data;
    const emailLower = email.toLowerCase();

    const { data: existingUsers, error: listError } =
      await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      console.error("hub signup step2 list users:", listError);
      return NextResponse.json(
        { error: "Erreur lors de la vérification de l'email" },
        { status: 500 }
      );
    }
    const emailExists = existingUsers.users.some(
      (u) => u.email?.toLowerCase() === emailLower
    );
    if (emailExists) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);

    const { error: updateError } = await adminSupabase
      .from("hub_signup_sessions")
      .update({
        first_name,
        last_name,
        email: emailLower,
        hashed_password: hashed,
        phone: phone || null,
        updated_at: now,
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("hub signup step2 update session:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de la session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      next_step: "step3",
    });
  } catch (err) {
    console.error("POST /api/hub/signup/step2:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Une erreur est survenue",
      },
      { status: 500 }
    );
  }
}
