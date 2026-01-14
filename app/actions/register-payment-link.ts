"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

interface RegisterPaymentLinkParams {
  token: string;
  fullName: string;
  phone: string;
  password: string;
}

interface RegisterPaymentLinkResult {
  error?: string;
  redirectUrl?: string;
}

export async function registerWithPaymentLink(
  params: RegisterPaymentLinkParams
): Promise<RegisterPaymentLinkResult> {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Step 1: Fetch and validate payment link (can use regular client)
    const { data: paymentLink, error: linkError } = await supabase
      .from("payment_links")
      .select(
        `
        *,
        product:products(id, name, price_amount, currency, stripe_price_id)
      `
      )
      .eq("token", params.token)
      .eq("status", "ACTIVE")
      .is("used_at", null)
      .single();

    if (linkError || !paymentLink) {
      return { error: "INVALID_LINK" };
    }

    // Validate expiration
    if (
      paymentLink.expires_at &&
      new Date(paymentLink.expires_at) < new Date()
    ) {
      return { error: "INVALID_LINK" };
    }

    // Type guard for product
    const product = Array.isArray(paymentLink.product)
      ? paymentLink.product[0]
      : paymentLink.product;

    if (!product || !product.stripe_price_id) {
      return { error: "PRODUCT_NOT_CONFIGURED" };
    }

    // Step 2: Create Supabase Auth user using admin client
    const { data: authData, error: signUpError } =
      await adminSupabase.auth.admin.createUser({
        email: paymentLink.prospect_email,
        password: params.password,
        user_metadata: {
          full_name: params.fullName,
          phone: params.phone,
        },
        email_confirm: true, // Auto-confirm email for payment link registration
      });

    if (signUpError) {
      console.error("Sign up error:", signUpError);
      // Check if user already exists
      if (
        signUpError.message.includes("already registered") ||
        signUpError.message.includes("already exists")
      ) {
        return { error: "EMAIL_EXISTS" };
      }
      return { error: signUpError.message };
    }

    if (!authData.user) {
      return { error: "FAILED_TO_CREATE_USER" };
    }

    // Step 3: Update profile with phone and full_name (trigger creates profile with full_name from metadata)
    // Use admin client to bypass RLS
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({
        phone: params.phone,
        full_name: params.fullName,
        status: "PENDING",
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail the registration if profile update fails - trigger may have already set it
    }

    // Step 4: Create order using admin client to bypass RLS
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        user_id: authData.user.id,
        product_id: paymentLink.product_id,
        payment_link_id: paymentLink.id,
        amount: product.price_amount,
        currency: product.currency,
        status: "PENDING",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return { error: "FAILED_TO_CREATE_ORDER" };
    }

    // Step 5: Update payment link as used (use admin client)
    const { error: linkUpdateError } = await adminSupabase
      .from("payment_links")
      .update({
        used_at: new Date().toISOString(),
        used_by: authData.user.id,
        status: "USED",
      })
      .eq("id", paymentLink.id);

    if (linkUpdateError) {
      console.error("Payment link update error:", linkUpdateError);
      // Non-critical error, continue
    }

    // Step 6: Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: product.stripe_price_id,
          quantity: 1,
        },
      ],
      customer_email: paymentLink.prospect_email,
      metadata: {
        order_id: order.id,
        user_id: authData.user.id,
        product_id: paymentLink.product_id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/register/${params.token}?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now
    });

    // Step 7: Update order with Stripe session ID (use admin client)
    await adminSupabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // Step 8: Return redirect URL
    if (!session.url) {
      return { error: "FAILED_TO_CREATE_CHECKOUT_SESSION" };
    }

    return { redirectUrl: session.url };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}
