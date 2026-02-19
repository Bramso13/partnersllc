import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

const PLAN_MONTHLY = "monthly";
const PLAN_YEARLY = "yearly";
type Plan = typeof PLAN_MONTHLY | typeof PLAN_YEARLY;

const baseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * POST /api/hub/signup/payment/create-checkout
 * Body: { signup_session_id: string, plan: 'monthly' | 'yearly' }
 * Crée une session Stripe Checkout et retourne l'URL de redirection.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { signup_session_id?: string; plan?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body JSON invalide" },
        { status: 400 }
      );
    }

    const signupSessionId = body.signup_session_id?.trim();
    const plan = body.plan as Plan | undefined;

    if (!signupSessionId) {
      return NextResponse.json(
        { error: "signup_session_id requis" },
        { status: 400 }
      );
    }
    if (plan !== PLAN_MONTHLY && plan !== PLAN_YEARLY) {
      return NextResponse.json(
        { error: "plan doit être 'monthly' ou 'yearly'" },
        { status: 400 }
      );
    }

    const priceId =
      plan === PLAN_YEARLY
        ? process.env.STRIPE_HUB_PRICE_YEARLY
        : process.env.STRIPE_HUB_PRICE_MONTHLY;

    if (!priceId) {
      const key =
        plan === PLAN_YEARLY ? "STRIPE_HUB_PRICE_YEARLY" : "STRIPE_HUB_PRICE_MONTHLY";
      console.error(`Missing env: ${key}`);
      return NextResponse.json(
        { error: "Configuration de paiement indisponible" },
        { status: 500 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: session, error: sessionError } = await adminSupabase
      .from("hub_signup_sessions")
      .select("id, email, first_name, last_name, expires_at")
      .eq("id", signupSessionId)
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

    const customerEmail = session.email ?? undefined;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        signup_session_id: signupSessionId,
        plan,
      },
      success_url: `${baseUrl()}/hub/signup/success`,
      cancel_url: `${baseUrl()}/hub/signup/cancel?signup_session_id=${encodeURIComponent(signupSessionId)}`,
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    });

    const url = checkoutSession.url;
    if (!url) {
      return NextResponse.json(
        { error: "Impossible de créer la session de paiement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("POST /api/hub/signup/payment/create-checkout:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Une erreur est survenue",
      },
      { status: 500 }
    );
  }
}
