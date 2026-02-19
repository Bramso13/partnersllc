import { stripe } from "@/lib/stripe";
import { createDossier } from "@/lib/dossiers";
import { createAdminClient } from "@/lib/supabase/server";
import type { SyncResult } from "../shared";

export async function syncPaymentStatus(userId: string): Promise<SyncResult> {
  const adminSupabase = createAdminClient();
  const result: SyncResult = { synced: 0, errors: [] };

  const { data: pendingOrders, error: ordersError } = await adminSupabase
    .from("orders")
    .select("id, product_id, stripe_checkout_session_id, status")
    .eq("user_id", userId)
    .in("status", ["PENDING", "FAILED"])
    .not("stripe_checkout_session_id", "is", null);

  if (ordersError) {
    console.error("Error fetching pending orders:", ordersError);
    result.errors.push(`Failed to fetch orders: ${ordersError.message}`);
    return result;
  }

  if (!pendingOrders || pendingOrders.length === 0) {
    return result;
  }

  for (const order of pendingOrders) {
    if (!order.stripe_checkout_session_id) continue;

    try {
      const session = await stripe.checkout.sessions.retrieve(
        order.stripe_checkout_session_id,
        { expand: ["payment_intent"] }
      );

      if (session.payment_status === "paid") {
        await processSuccessfulPayment(adminSupabase, order, session, userId);
        result.synced++;
        console.log(`Synced payment for order ${order.id}`);
      } else if (session.status === "expired") {
        await adminSupabase
          .from("orders")
          .update({
            status: "FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);
      }
    } catch (err) {
      const error = err as Error;
      console.error(`Error checking session for order ${order.id}:`, error);
      result.errors.push(`Order ${order.id}: ${error.message}`);
    }
  }

  if (result.synced > 0) {
    const { data: paidOrder } = await adminSupabase
      .from("orders")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "PAID")
      .limit(1)
      .single();

    if (paidOrder) {
      const { data: latestPaidOrder } = await adminSupabase
        .from("orders")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .eq("status", "PAID")
        .order("paid_at", { ascending: false })
        .limit(1)
        .single();

      await adminSupabase
        .from("profiles")
        .update({
          status: "ACTIVE",
          stripe_customer_id: latestPaidOrder?.stripe_customer_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      console.log(`Activated profile for user ${userId}`);
    }
  }

  return result;
}

async function processSuccessfulPayment(
  adminSupabase: ReturnType<typeof createAdminClient>,
  order: { id: string; product_id: string },
  session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>,
  userId: string
) {
  const paidAt = new Date().toISOString();
  const amountPaid = session.amount_total || 0;

  const { error: orderUpdateError } = await adminSupabase
    .from("orders")
    .update({
      status: "PAID",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null,
      stripe_customer_id:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id || null,
      amount: amountPaid,
      paid_at: paidAt,
      updated_at: paidAt,
    })
    .eq("id", order.id);

  if (orderUpdateError) {
    throw new Error(`Failed to update order: ${orderUpdateError.message}`);
  }

  const { data: existingDossier } = await adminSupabase
    .from("dossiers")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", order.product_id)
    .limit(1)
    .single();

  if (existingDossier) {
    await adminSupabase
      .from("orders")
      .update({
        dossier_id: existingDossier.id,
        updated_at: paidAt,
      })
      .eq("id", order.id)
      .is("dossier_id", null);

    return;
  }

  const { data: product, error: productError } = await adminSupabase
    .from("products")
    .select("id, dossier_type, initial_status")
    .eq("id", order.product_id)
    .single();

  if (productError || !product) {
    throw new Error(`Failed to fetch product: ${productError?.message || "Product not found"}`);
  }

  const { data: dossier, error: dossierError } = await createDossier(
    adminSupabase,
    {
      user_id: userId,
      product_id: order.product_id,
      type: product.dossier_type,
      status: product.initial_status || "QUALIFICATION",
      metadata: { order_id: order.id, created_via: "payment_sync" },
    }
  );

  if (dossierError || !dossier) {
    throw new Error(`Failed to create dossier: ${dossierError?.message || "Unknown error"}`);
  }

  const { data: productSteps, error: productStepsError } = await adminSupabase
    .from("product_steps")
    .select("step_id, position")
    .eq("product_id", order.product_id)
    .order("position", { ascending: true });

  if (productStepsError) {
    throw new Error(`Failed to fetch product steps: ${productStepsError.message}`);
  }

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

    const firstInstance =
      createdInstances.find((si) => si.started_at !== null) || createdInstances[0];

    if (firstInstance) {
      await adminSupabase
        .from("dossiers")
        .update({
          current_step_instance_id: firstInstance.id,
          updated_at: paidAt,
        })
        .eq("id", dossier.id);
    }
  }

  await adminSupabase
    .from("orders")
    .update({
      dossier_id: dossier.id,
      updated_at: paidAt,
    })
    .eq("id", order.id);

  await adminSupabase.from("events").insert({
    entity_type: "dossier",
    entity_id: dossier.id,
    event_type: "DOSSIER_CREATED",
    actor_type: "SYSTEM",
    actor_id: null,
    payload: {
      dossier_id: dossier.id,
      user_id: userId,
      product_id: order.product_id,
      order_id: order.id,
      created_via: "payment_sync",
    },
  });

  await adminSupabase.from("events").insert({
    entity_type: "order",
    entity_id: order.id,
    event_type: "PAYMENT_RECEIVED",
    actor_type: "SYSTEM",
    actor_id: null,
    payload: {
      order_id: order.id,
      amount_paid: amountPaid,
      currency: session.currency || "usd",
      stripe_session_id: session.id,
      synced_via: "dashboard_load",
    },
  });
}
