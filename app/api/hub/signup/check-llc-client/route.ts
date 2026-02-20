import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/hub/signup/check-llc-client
 * Body: { email: string }
 * Vérifie si l'email appartient à un client Partners LLC.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: profileRow, error: rpcError } = await admin.rpc("get_profile_by_email", {
      e: email,
    });

    if (rpcError) {
      console.error("[hub/signup/check-llc-client]", rpcError);
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

    return NextResponse.json({
      is_llc_client: true,
      existing_user_id: row.profile_id as string,
    });
  } catch (err) {
    console.error("[hub/signup/check-llc-client]", err);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
