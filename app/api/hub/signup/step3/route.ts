import { NextResponse } from "next/server";
import {
  hubSignupStep3BodySchema,
  type HubSignupStep3Body,
} from "@/lib/validation/hub-signup-schemas";
import {
  getSignupSession,
  updateSignupSessionStep3,
} from "@/lib/hub/signup-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = hubSignupStep3BodySchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message =
        Object.entries(first)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("; ") || "Validation échouée";
      return NextResponse.json(
        { error: "Validation échouée", details: first },
        { status: 400 }
      );
    }

    const { signup_session_id, country, profession, bio } =
      parsed.data as HubSignupStep3Body;

    const session = await getSignupSession(signup_session_id);
    if (!session) {
      return NextResponse.json(
        { error: "Session d'inscription introuvable ou expirée" },
        { status: 404 }
      );
    }

    const result = await updateSignupSessionStep3(signup_session_id, {
      country,
      profession,
      bio: bio ?? "",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Erreur lors de la mise à jour de la session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signup_session_id,
      next_step: "step4",
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Erreur serveur lors de l'étape 3",
      },
      { status: 500 }
    );
  }
}
