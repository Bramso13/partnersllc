import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  hubSignupStep1BodySchema,
  type HubSignupStep1Body,
} from "@/lib/validation/hub-signup-schemas";

const SIGNUP_SESSION_TTL_HOURS = 24;

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parseResult = hubSignupStep1BodySchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.flatten();
      const message =
        firstError.formErrors?.[0] ??
        firstError.fieldErrors?.accountType?.[0] ??
        firstError.fieldErrors?.email?.[0] ??
        "Données invalides";
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    const { accountType, email } = parseResult.data as HubSignupStep1Body;

    let is_llc_client = false;
    let existing_user_id: string | null = null;

    if (accountType === "existing_llc" && email) {
      const admin = createAdminClient();
      const { data: profileRow, error: rpcError } = await admin.rpc(
        "get_profile_by_email",
        { e: email }
      );

      if (rpcError) {
        console.error("[hub/signup/step1] get_profile_by_email error:", rpcError);
        return NextResponse.json(
          { error: "Erreur lors de la vérification de l'email" },
          { status: 500 }
        );
      }

      const row = Array.isArray(profileRow) ? profileRow[0] : profileRow;
      if (!row || !row.profile_id) {
        return NextResponse.json(
          { error: "Email non trouvé dans nos clients Partners LLC" },
          { status: 404 }
        );
      }

      if (row.role !== "CLIENT") {
        return NextResponse.json(
          { error: "Email non trouvé dans nos clients Partners LLC" },
          { status: 404 }
        );
      }

      is_llc_client = true;
      existing_user_id = row.profile_id as string;
    }

    const admin = createAdminClient();
    const signup_session_id = crypto.randomUUID();
    const now = new Date();
    const expires_at = new Date(now.getTime() + SIGNUP_SESSION_TTL_HOURS * 60 * 60 * 1000);

    const { error: insertError } = await admin
      .from("hub_signup_sessions")
      .insert({
        id: signup_session_id,
        account_type: accountType,
        email: email ?? null,
        is_llc_client: is_llc_client,
        existing_user_id,
        created_at: now.toISOString(),
        expires_at: expires_at.toISOString(),
      });

    if (insertError) {
      console.error("[hub/signup/step1] insert session error:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création de la session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signup_session_id,
      next_step: "step2",
      is_llc_client,
    });
  } catch (err) {
    console.error("[hub/signup/step1] unexpected error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur lors de l'inscription",
      },
      { status: 500 }
    );
  }
}
