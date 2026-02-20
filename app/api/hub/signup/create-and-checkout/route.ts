import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

const baseUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
type Plan = "monthly" | "yearly";

const bodySchema = {
  first_name: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  last_name: (v: unknown) => typeof v === "string" && v.trim().length > 0,
  email: (v: unknown) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v as string).trim()),
  password: (v: unknown) => typeof v === "string" && v.length >= 8,
  country: (v: unknown) => typeof v === "string" && v.length === 2,
  profession: (v: unknown) => typeof v === "string",
  bio: (v: unknown) => typeof v === "string",
  plan: (v: unknown) => v === "monthly" || v === "yearly",
};

/**
 * POST /api/hub/signup/create-and-checkout
 * Nouveaux membres : crée auth user, profile (role hub_member), puis Stripe checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    const firstName = typeof body.first_name === "string" ? body.first_name.trim() : "";
    const lastName = typeof body.last_name === "string" ? body.last_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const country = typeof body.country === "string" ? body.country.toUpperCase().slice(0, 2) : "";
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 100) : "";
    const profession = typeof body.profession === "string" ? body.profession.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 300) : "";
    const plan = (body.plan === "monthly" || body.plan === "yearly") ? body.plan : "yearly";

    if (!bodySchema.first_name(firstName) || !bodySchema.last_name(lastName) || !bodySchema.email(email) || !bodySchema.password(password)) {
      return NextResponse.json(
        { error: "Données invalides (first_name, last_name, email, password requis)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Vérifier que l'email n'existe pas déjà
    const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (existingUsers?.users?.some((u) => u.email?.toLowerCase() === email)) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    // Créer l'utilisateur auth (trigger crée profile avec role CLIENT par défaut)
    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !authData?.user) {
      console.error("[hub/signup/create-and-checkout] createUser:", createError);
      return NextResponse.json(
        { error: createError?.message ?? "Erreur lors de la création du compte" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Mettre à jour le profile : role hub_member
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        role: "hub_member",
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.error("[hub/signup/create-and-checkout] profile update:", profileError);
      // L'utilisateur est créé, on continue (le rôle peut être mis à jour plus tard)
    }

    // Stripe checkout
    const priceId =
      plan === "yearly"
        ? process.env.STRIPE_HUB_PRICE_YEARLY
        : process.env.STRIPE_HUB_PRICE_MONTHLY;

    if (!priceId) {
      const key = plan === "yearly" ? "STRIPE_HUB_PRICE_YEARLY" : "STRIPE_HUB_PRICE_MONTHLY";
      console.error(`[hub/signup/create-and-checkout] Missing ${key}`);
      return NextResponse.json(
        { error: "Configuration de paiement indisponible" },
        { status: 500 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: {
        user_id: userId,
        plan,
        hub_signup: "1",
        country: country || "",
        city: city || "",
        profession: profession.slice(0, 100),
        bio: bio.slice(0, 300),
      },
      success_url: `${baseUrl()}/hub/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl()}/hub/signup?step=4`,
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
    console.error("[hub/signup/create-and-checkout]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
