import { stripe } from "@/lib/stripe";
import { createDossier } from "@/lib/dossiers";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const error = err as Error;
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      try {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      } catch (error) {
        console.error("Error handling checkout.session.completed:", error);
        // Log to Sentry if available (not installed yet)
        // Sentry.captureException(error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
      break;
    case "payment_intent.succeeded":
      // Payment intent events are handled via checkout.session.completed
      console.log("Payment intent succeeded:", event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const adminSupabase = createAdminClient();

  // Extract metadata from checkout session
  const orderId = session.metadata?.order_id;
  const userId = session.metadata?.user_id;
  const productId = session.metadata?.product_id;
  const paymentLinkToken = session.metadata?.payment_link_token;

  const paidAt = new Date().toISOString();
  const amountPaid = session.amount_total || 0;

  // Check if this is a payment link payment (new inverted flow)
  if (paymentLinkToken) {
    // Handle payment link payment
    const { data: paymentLink, error: linkError } = await adminSupabase
      .from("payment_links")
      .select("id, status, product_id, prospect_email")
      .eq("token", paymentLinkToken)
      .single();

    if (linkError || !paymentLink) {
      throw new Error(`Payment link not found: ${paymentLinkToken}`);
    }

    // Idempotency check
    if (paymentLink.status === "PAID" || paymentLink.status === "USED") {
      console.log(`Payment link ${paymentLinkToken} already processed, skipping`);
      return;
    }

    // Create order for payment link (without user_id initially)
    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        product_id: paymentLink.product_id,
        payment_link_id: paymentLink.id,
        amount: amountPaid,
        currency: session.currency || "usd",
        status: "PAID",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string | null,
        stripe_customer_id: session.customer as string | null,
        paid_at: paidAt,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to create order for payment link: ${orderError?.message || "Unknown error"}`);
    }

    // Update payment link with payment details
    const { error: linkUpdateError } = await adminSupabase
      .from("payment_links")
      .update({
        status: "PAID",
        paid_at: paidAt,
        stripe_customer_id: session.customer as string | null,
        amount_paid: amountPaid,
        order_id: order.id,
        // updated_at: paidAt, // TODO: Uncomment after migration
      })
      .eq("id", paymentLink.id);

    if (linkUpdateError) {
      console.error("Failed to update payment link:", linkUpdateError);
      // Non-critical error, continue
    }

    // Create PAYMENT_RECEIVED event for payment link
    const { error: paymentEventError } = await adminSupabase.from("events").insert({
      entity_type: "payment_link",
      entity_id: paymentLink.id,
      event_type: "PAYMENT_RECEIVED",
      actor_type: "SYSTEM",
      actor_id: null,
      payload: {
        payment_link_token: paymentLinkToken,
        order_id: order.id,
        amount_paid: amountPaid,
        currency: session.currency || "usd",
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        prospect_email: paymentLink.prospect_email,
      },
    });

    if (paymentEventError) {
      console.error("Failed to create PAYMENT_RECEIVED event for payment link:", paymentEventError);
      // Non-critical error, continue
    }

    console.log(`Successfully processed payment link payment ${session.id} for token ${paymentLinkToken}`);
    return;
  }

  // Handle traditional registration flow (existing logic)
  if (!orderId || !userId || !productId) {
    throw new Error("Missing required metadata in checkout session");
  }

  // Idempotency check: Verify order is not already PAID
  const { data: existingOrder, error: orderFetchError } = await adminSupabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (orderFetchError) {
    throw new Error(`Failed to fetch order: ${orderFetchError.message}`);
  }

  if (!existingOrder) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (existingOrder.status === "PAID") {
    // Order already processed, return success (idempotency)
    console.log(`Order ${orderId} already processed, skipping`);
    return;
  }

  // Update order record
  const { data: updatedOrder, error: orderUpdateError } = await adminSupabase
    .from("orders")
    .update({
      status: "PAID",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string | null,
      stripe_customer_id: session.customer as string | null,
      amount: amountPaid, // Update amount with actual paid amount
      paid_at: paidAt,
      updated_at: paidAt,
    })
    .eq("id", orderId)
    .select()
    .single();

  if (orderUpdateError || !updatedOrder) {
    throw new Error(`Failed to update order: ${orderUpdateError?.message || "Unknown error"}`);
  }

  // Activate user profile
  const { error: profileUpdateError } = await adminSupabase
    .from("profiles")
    .update({
      status: "ACTIVE",
      stripe_customer_id: session.customer as string | null,
      updated_at: paidAt,
    })
    .eq("id", userId);

  if (profileUpdateError) {
    throw new Error(`Failed to activate profile: ${profileUpdateError.message}`);
  }

  // Get product info for dossier creation
  const { data: product, error: productError } = await adminSupabase
    .from("products")
    .select("id, dossier_type, initial_status")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    throw new Error(`Failed to fetch product: ${productError?.message || "Product not found"}`);
  }

  const { data: dossier, error: dossierError } = await createDossier(
    adminSupabase,
    {
      user_id: userId,
      product_id: productId,
      type: product.dossier_type,
      status: product.initial_status || "QUALIFICATION",
      metadata: {
        order_id: orderId,
        created_via: "traditional_registration",
      },
    }
  );

  if (dossierError || !dossier) {
    throw new Error(`Failed to create dossier: ${dossierError?.message || "Unknown error"}`);
  }

  // Get product steps
  const { data: productSteps, error: productStepsError } = await adminSupabase
    .from("product_steps")
    .select("step_id, position")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (productStepsError) {
    throw new Error(`Failed to fetch product steps: ${productStepsError.message}`);
  }

  // Create step instances
  if (productSteps && productSteps.length > 0) {
    const startedAt = new Date().toISOString();
    const stepInstancesData = productSteps.map((ps, index) => ({
      dossier_id: dossier.id,
      step_id: ps.step_id,
      started_at: index === 0 ? startedAt : null,
    }));

    const { data: createdInstances, error: instancesError } = await adminSupabase
      .from("step_instances")
      .insert(stepInstancesData)
      .select("id, started_at");

    if (instancesError || !createdInstances) {
      throw new Error(`Failed to create step instances: ${instancesError?.message || "Unknown error"}`);
    }

    // Set current_step_instance_id to first step (the one with started_at)
    const firstInstance = createdInstances.find((si) => si.started_at !== null) || createdInstances[0];

    if (firstInstance) {
      const { error: dossierUpdateError } = await adminSupabase
        .from("dossiers")
        .update({
          current_step_instance_id: firstInstance.id,
          // updated_at: paidAt, // TODO: Uncomment after migration
        })
        .eq("id", dossier.id);

      if (dossierUpdateError) {
        throw new Error(`Failed to update dossier current step: ${dossierUpdateError.message}`);
      }
    }
  }

  // Link dossier to order
  const { error: orderLinkError } = await adminSupabase
    .from("orders")
    .update({
      dossier_id: dossier.id,
      updated_at: paidAt,
    })
    .eq("id", orderId);

  if (orderLinkError) {
    console.error("Failed to link dossier to order:", orderLinkError);
    // Non-critical error, continue
  }

  // Create DOSSIER_CREATED event
  const { error: dossierEventError } = await adminSupabase.from("events").insert({
    entity_type: "dossier",
    entity_id: dossier.id,
    event_type: "DOSSIER_CREATED",
    actor_type: "SYSTEM",
    actor_id: null,
    payload: {
      dossier_id: dossier.id,
      user_id: userId,
      product_id: productId,
      order_id: orderId,
    },
  });

  if (dossierEventError) {
    console.error("Failed to create DOSSIER_CREATED event:", dossierEventError);
    // Non-critical error, continue
  }

  // Create PAYMENT_RECEIVED event
  const { error: paymentEventError } = await adminSupabase.from("events").insert({
    entity_type: "order",
    entity_id: orderId,
    event_type: "PAYMENT_RECEIVED",
    actor_type: "SYSTEM",
    actor_id: null,
    payload: {
      order_id: orderId,
      amount_paid: amountPaid,
      currency: session.currency || "usd",
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
    },
  });

  if (paymentEventError) {
    console.error("Failed to create PAYMENT_RECEIVED event:", paymentEventError);
    // Non-critical error, continue
  }

  console.log(`Successfully processed traditional checkout session ${session.id} for order ${orderId}`);
}
