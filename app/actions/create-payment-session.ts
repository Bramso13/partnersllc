"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

interface CreatePaymentSessionParams {
  token: string;
}

interface CreatePaymentSessionResult {
  error?: string;
  redirectUrl?: string;
}

export async function createPaymentSession(
  token: string
): Promise<CreatePaymentSessionResult> {
  try {
    const supabase = await createClient();

    // Step 1: Fetch and validate payment link
    const { data: paymentLink, error: linkError } = await supabase
      .from("payment_links")
      .select(
        `
        *,
        product:products(id, name, description, price_amount, currency, stripe_price_id)
      `
      )
      .eq("token", token)
    //   .eq("status", "ACTIVE") TODO: Uncomment after migration
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

    // Step 2: Create Stripe Checkout Session
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
        payment_link_token: token,
        product_id: paymentLink.product_id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/register/${token}/complete`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/register/${token}?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now
    });

    // Step 3: Update payment link with session ID and status
    const { error: updateError } = await supabase
      .from("payment_links")
      .update({
        status: "PAYMENT_INITIATED",
        stripe_checkout_session_id: session.id,
        // updated_at: new Date().toISOString(), // TODO: Uncomment after migration
      })
      .eq("id", paymentLink.id);

    if (updateError) {
      console.error("Failed to update payment link status:", updateError);
      // Non-critical error, continue
    }

    // Step 4: Return redirect URL
    if (!session.url) {
      return { error: "FAILED_TO_CREATE_CHECKOUT_SESSION" };
    }

    return { redirectUrl: session.url };
  } catch (error) {
    console.error("Create payment session error:", error);
    return {
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}