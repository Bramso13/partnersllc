"use server";

import { createDossier } from "@/lib/dossiers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

interface CompleteRegistrationParams {
  token: string;
  fullName: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
}

interface CompleteRegistrationResult {
  error?: string;
  redirectUrl?: string;
}

export async function completeRegistration(
  params: CompleteRegistrationParams
): Promise<CompleteRegistrationResult> {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Step 1: Fetch and validate payment link (must be PAID)
    const { data: paymentLink, error: linkError } = await supabase
      .from("payment_links")
      .select(
        `
        *,
        product:products(id, name, price_amount, currency, stripe_price_id)
      `
      )
      .eq("token", params.token)
      .single();

    if (linkError || !paymentLink) {
      return { error: "INVALID_LINK" };
    }

    // Must be paid and not used
    if (paymentLink.status !== "PAID") {
      // Double-check with Stripe
      try {
        if (paymentLink.stripe_checkout_session_id) {
          const session = await stripe.checkout.sessions.retrieve(
            paymentLink.stripe_checkout_session_id
          );

          if (session.payment_status !== "paid") {
            return { error: "PAYMENT_NOT_VERIFIED" };
          }
        } else {
          return { error: "PAYMENT_NOT_VERIFIED" };
        }
      } catch (stripeError) {
        console.error("Stripe payment verification error:", stripeError);
        return { error: "PAYMENT_NOT_VERIFIED" };
      }
    }

    if (paymentLink.used_at) {
      return { error: "EMAIL_EXISTS" }; // Link already used
    }

    // Type guard for product
    const product = Array.isArray(paymentLink.product)
      ? paymentLink.product[0]
      : paymentLink.product;

    if (!product) {
      return { error: "PRODUCT_NOT_FOUND" };
    }

    // Step 2: Create Supabase Auth user
    const { data: authData, error: signUpError } =
      await adminSupabase.auth.admin.createUser({
        email: paymentLink.prospect_email,
        password: params.password,
        user_metadata: {
          full_name: params.fullName,
          phone: params.phone,
        },
        email_confirm: true,
      });

    if (signUpError) {
      console.error("Sign up error:", signUpError);
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

    // Step 3: Update profile with terms acceptance
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({
        full_name: params.fullName,
        phone: params.phone,
        status: "ACTIVE", // Activate immediately since payment is confirmed
        terms_accepted: params.termsAccepted,
        terms_accepted_at: params.termsAccepted
          ? new Date().toISOString()
          : null,
        // updated_at: new Date().toISOString(), // TODO: Uncomment after migration
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Step 4: Get or create Stripe customer
    let stripeCustomerId = paymentLink.stripe_customer_id;

    if (!stripeCustomerId && paymentLink.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          paymentLink.stripe_checkout_session_id
        );
        stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
      } catch (error) {
        console.error("Error retrieving Stripe customer:", error);
      }
    }

    // Update profile with Stripe customer ID if available
    if (stripeCustomerId) {
      await adminSupabase
        .from("profiles")
        .update({
          stripe_customer_id: stripeCustomerId,
          // updated_at: new Date().toISOString(), // TODO: Uncomment after migration
        })
        .eq("id", authData.user.id);
    }

    // Step 5: Create or update order
    let orderId = paymentLink.order_id;

    if (!orderId) {
      // Create new order if it doesn't exist
      const { data: order, error: orderError } = await adminSupabase
        .from("orders")
        .insert({
          user_id: authData.user.id,
          product_id: paymentLink.product_id,
          payment_link_id: paymentLink.id,
          amount: paymentLink.amount_paid || product.price_amount,
          currency: product.currency,
          status: "PAID",
          stripe_checkout_session_id: paymentLink.stripe_checkout_session_id,
          stripe_customer_id: stripeCustomerId,
          paid_at: paymentLink.paid_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error("Order creation error:", orderError);
        return { error: "FAILED_TO_CREATE_ORDER" };
      }

      orderId = order.id;
    } else {
      // Update existing order with user_id
      await adminSupabase
        .from("orders")
        .update({
          user_id: authData.user.id,
          // updated_at: new Date().toISOString(), // TODO: Uncomment after migration
        })
        .eq("id", orderId);
    }

    // Step 6: Create dossier if it doesn't exist
    const { data: existingDossier } = await adminSupabase
      .from("dossiers")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("product_id", paymentLink.product_id)
      .single();

    if (!existingDossier) {
      // Get product info for dossier creation
      const { data: productDetails, error: productError } = await adminSupabase
        .from("products")
        .select("id, dossier_type, initial_status")
        .eq("id", paymentLink.product_id)
        .single();

      if (!productError && productDetails) {
        const { data: dossier, error: dossierError } = await createDossier(
          adminSupabase,
          {
            user_id: authData.user.id,
            product_id: paymentLink.product_id,
            type: productDetails.dossier_type,
            status: productDetails.initial_status || "QUALIFICATION",
            metadata: {
              order_id: orderId,
              created_via: "payment_link_completion",
            },
          }
        );

        if (!dossierError && dossier) {
          // Get product steps
          const { data: productSteps, error: productStepsError } =
            await adminSupabase
              .from("product_steps")
              .select("step_id, position")
              .eq("product_id", paymentLink.product_id)
              .order("position", { ascending: true });

          if (!productStepsError && productSteps && productSteps.length > 0) {
            const startedAt = new Date().toISOString();
            const stepInstancesData = productSteps.map((ps, index) => ({
              dossier_id: dossier.id,
              step_id: ps.step_id,
              started_at: index === 0 ? startedAt : null,
            }));

            const { data: createdInstances, error: instancesError } =
              await adminSupabase
                .from("step_instances")
                .insert(stepInstancesData)
                .select("id, started_at");

            if (!instancesError && createdInstances) {
              // Set current_step_instance_id to first step
              const firstInstance =
                createdInstances.find((si) => si.started_at !== null) ||
                createdInstances[0];

              if (firstInstance) {
                await adminSupabase
                  .from("dossiers")
                  .update({
                    current_step_instance_id: firstInstance.id,
                    // updated_at: new Date().toISOString(), // TODO: Uncomment after migration
                  })
                  .eq("id", dossier.id);
              }
            }
          }

          // Link dossier to order
          await adminSupabase
            .from("orders")
            .update({
              dossier_id: dossier.id,
              // updated_at: new Date().toISOString(), // TODO: Uncomment after migration
            })
            .eq("id", orderId);

          // Create DOSSIER_CREATED event
          await adminSupabase.from("events").insert({
            entity_type: "dossier",
            entity_id: dossier.id,
            event_type: "DOSSIER_CREATED",
            actor_type: "SYSTEM",
            actor_id: null,
            payload: {
              dossier_id: dossier.id,
              user_id: authData.user.id,
              product_id: paymentLink.product_id,
              order_id: orderId,
            },
          });
        }
      }
    }

    // Step 7: Mark payment link as used
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
    }

    // Step 8: Create ACCOUNT_CREATED event
    await adminSupabase.from("events").insert({
      entity_type: "profile",
      entity_id: authData.user.id,
      event_type: "ACCOUNT_CREATED",
      actor_type: "USER",
      actor_id: authData.user.id,
      payload: {
        user_id: authData.user.id,
        email: paymentLink.prospect_email,
        created_via: "payment_link_completion",
        order_id: orderId,
      },
    });

    // Step 9: Return redirect URL (via clear-pending-cookie so cookie is removed)
    return {
      redirectUrl: `/api/register/clear-pending-cookie?then=${encodeURIComponent("/dashboard?welcome=true")}`,
    };
  } catch (error) {
    console.error("Registration completion error:", error);
    return {
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}
