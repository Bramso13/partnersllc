import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/hub/signup/complete-llc
 * Pour les clients Partners LLC : crée hub_subscription + hub_member_profile sans paiement.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      existing_user_id,
      email,
      first_name,
      last_name,
      phone,
      country,
      city,
      profession,
      bio,
    } = body as Record<string, unknown>;

    const userId = typeof existing_user_id === "string" ? existing_user_id.trim() : "";
    const emailStr = typeof email === "string" ? email.trim() : "";
    const firstName = typeof first_name === "string" ? first_name.trim() : "";
    const lastName = typeof last_name === "string" ? last_name.trim() : "";
    const countryCode = typeof country === "string" ? country.toUpperCase().slice(0, 2) : null;
    const cityStr = typeof city === "string" ? city.trim().slice(0, 100) || null : null;
    const professionStr = typeof profession === "string" ? profession.trim() : "";
    const bioStr = typeof bio === "string" ? bio.trim().slice(0, 300) : "";
    const phoneStr = typeof phone === "string" ? phone.trim() || null : null;

    if (!userId || !emailStr || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Données incomplètes (existing_user_id, email, first_name, last_name requis)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Vérifier que l'utilisateur existe et est bien un client LLC
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (profileError || !profile || profile.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Utilisateur non éligible" },
        { status: 403 }
      );
    }

    // Vérifier qu'il n'a pas déjà un hub_member_profile
    const { data: existingProfile } = await admin
      .from("hub_member_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "Vous avez déjà un compte Partners Hub" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 an par défaut

    // hub_subscription active (sans Stripe)
    const { error: subError } = await admin
      .from("hub_subscriptions")
      .insert({
        user_id: userId,
        plan: "yearly",
        status: "active",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

    if (subError) {
      console.error("[hub/signup/complete-llc] hub_subscriptions:", subError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'abonnement" },
        { status: 500 }
      );
    }

    const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || null;

    // hub_member_profile
    const { error: memberError } = await admin
      .from("hub_member_profiles")
      .insert({
        user_id: userId,
        display_name: displayName,
        country: countryCode,
        city: cityStr,
        profession: professionStr || null,
        bio: bioStr || null,
        is_llc_client: true,
      });

    if (memberError) {
      console.error("[hub/signup/complete-llc] hub_member_profiles:", memberError);
      // Rollback subscription (best effort)
      await admin.from("hub_subscriptions").delete().eq("user_id", userId);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[hub/signup/complete-llc]", err);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
