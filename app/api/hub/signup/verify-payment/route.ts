import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/hub/signup/verify-payment
 * Body: { session_id: string }
 * Vérifie le paiement Stripe via session_id, puis crée hub_subscription + hub_member_profile.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { error: "session_id Stripe requis" },
        { status: 400 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Paiement non confirmé" },
        { status: 400 }
      );
    }

    const userId = checkoutSession.metadata?.user_id;
    const plan = (checkoutSession.metadata?.plan === "monthly" ? "monthly" : "yearly") as "monthly" | "yearly";
    const country = (checkoutSession.metadata?.country ?? "").toUpperCase().slice(0, 2) || null;
    const city = checkoutSession.metadata?.city?.trim()?.slice(0, 100) || null;
    const profession = checkoutSession.metadata?.profession?.trim() || null;
    const bio = checkoutSession.metadata?.bio?.trim()?.slice(0, 300) || null;

    if (!userId) {
      return NextResponse.json(
        { error: "Session invalide (metadata manquant)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Vérifier que l'utilisateur existe
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Idempotence : déjà complété ?
    const { data: existingSub } = await admin
      .from("hub_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingSub) {
      return NextResponse.json({ success: true, already_completed: true });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + (plan === "yearly" ? 1 : 0));
    expiresAt.setMonth(expiresAt.getMonth() + (plan === "monthly" ? 1 : 0));

    // hub_subscription
    const { error: subError } = await admin
      .from("hub_subscriptions")
      .insert({
        user_id: userId,
        plan,
        status: "active",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        stripe_subscription_id: checkoutSession.subscription as string | null ?? undefined,
        stripe_customer_id: checkoutSession.customer as string | null ?? undefined,
      });

    if (subError) {
      console.error("[hub/signup/verify-payment] hub_subscriptions:", subError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'abonnement" },
        { status: 500 }
      );
    }

    // hub_member_profile (country, profession, bio depuis Stripe metadata)
    const { error: memberError } = await admin
      .from("hub_member_profiles")
      .insert({
        user_id: userId,
        display_name: profile.full_name ?? null,
        country,
        city,
        profession,
        bio,
        is_llc_client: false,
      });

    if (memberError) {
      console.error("[hub/signup/verify-payment] hub_member_profiles:", memberError);
      await admin.from("hub_subscriptions").delete().eq("user_id", userId);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[hub/signup/verify-payment]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
