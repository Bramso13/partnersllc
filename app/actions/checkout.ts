"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function createRetryCheckoutSession(): Promise<string | null> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Get user's profile to retrieve stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name, phone")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return null;
    }

    // Get user's most recent order with PENDING or FAILED status
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        product_id,
        amount,
        currency,
        products!inner (
          id,
          name,
          stripe_price_id
        )
      `
      )
      .eq("user_id", user.id)
      .in("status", ["PENDING", "FAILED"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return null;
    }

    // Supabase returns relations as arrays, but with .single() and !inner, we get single objects
    const product = Array.isArray(order.products)
      ? order.products[0]
      : (order.products as {
          id: string;
          name: string;
          stripe_price_id: string | null;
        });

    if (!product.stripe_price_id) {
      console.error("Product does not have a Stripe price ID");
      return null;
    }

    // Get or create Stripe customer
    let stripeCustomerId = profile.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create Stripe customer if not exists
      const stripeCustomer = await stripe.customers.create({
        email: user.email || undefined,
        name: profile.full_name || undefined,
        phone: profile.phone || undefined,
        metadata: {
          user_id: user.id,
          source: "retry_checkout",
        },
      });
      stripeCustomerId = stripeCustomer.id;

      // Save stripe_customer_id to profile
      await supabase
        .from("profiles")
        .update({
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    // Create new Stripe Checkout Session with customer ID
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: product.stripe_price_id,
          quantity: 1,
        },
      ],
      customer: stripeCustomerId, // Use customer ID instead of email
      metadata: {
        order_id: order.id,
        user_id: user.id,
        product_id: product.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now
    });

    // Update order with new checkout session ID and stripe_customer_id
    await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return session.url;
  } catch (error) {
    console.error("Error creating retry checkout session:", error);
    return null;
  }
}
