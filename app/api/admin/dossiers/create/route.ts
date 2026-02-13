import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateDossierForExistingClientSchema = z.object({
  client_id: z.string().uuid("client_id invalide"),
  product_id: z.string().uuid("product_id invalide"),
  initial_status: z
    .enum(["QUALIFICATION", "IN_PROGRESS", "PENDING"])
    .optional()
    .default("QUALIFICATION"),
});

/**
 * POST /api/admin/dossiers/create
 * Create a dossier for an existing client (without creating a new user).
 * Creates: order (PAID) + dossier + step_instances
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth();

    const body: unknown = await request.json();
    const validation = CreateDossierForExistingClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message },
        { status: 400 }
      );
    }

    const { client_id, product_id, initial_status } = validation.data;
    const supabase = createAdminClient();

    // Verify client exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", client_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Verify product is active
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price_amount, currency, dossier_type, initial_status, active")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    if (!product.active) {
      return NextResponse.json(
        { error: "Produit inactif" },
        { status: 400 }
      );
    }

    // Create order (fictive, status PAID)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: client_id,
        product_id,
        amount: product.price_amount,
        currency: product.currency,
        status: "PAID",
        paid_at: new Date().toISOString(),
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("[create-dossier] Error creating order:", orderError);
      return NextResponse.json(
        { error: "Erreur lors de la création de la commande" },
        { status: 500 }
      );
    }

    // Create dossier
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .insert({
        user_id: client_id,
        product_id,
        type: product.dossier_type,
        status: initial_status,
        metadata: {
          order_id: order.id,
          created_via: "manual_admin_creation",
          created_by_admin: adminUser.id,
        },
      })
      .select()
      .single();

    if (dossierError || !dossier) {
      console.error("[create-dossier] Error creating dossier:", dossierError);
      return NextResponse.json(
        { error: "Erreur lors de la création du dossier" },
        { status: 500 }
      );
    }

    // Link order to dossier
    await supabase
      .from("orders")
      .update({ dossier_id: dossier.id })
      .eq("id", order.id);

    // Create step instances
    const { data: productSteps, error: productStepsError } = await supabase
      .from("product_steps")
      .select("step_id, position")
      .eq("product_id", product_id)
      .order("position", { ascending: true });

    if (productStepsError) {
      console.error("[create-dossier] Error fetching product steps:", productStepsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des étapes" },
        { status: 500 }
      );
    }

    if (productSteps && productSteps.length > 0) {
      const startedAt = new Date().toISOString();
      const stepInstancesData = productSteps.map((ps, index) => ({
        dossier_id: dossier.id,
        step_id: ps.step_id,
        started_at: index === 0 ? startedAt : null,
      }));

      const { data: createdInstances, error: instancesError } = await supabase
        .from("step_instances")
        .insert(stepInstancesData)
        .select("id, started_at");

      if (instancesError) {
        console.error("[create-dossier] Error creating step instances:", instancesError);
        return NextResponse.json(
          { error: "Erreur lors de la création des étapes" },
          { status: 500 }
        );
      }

      if (createdInstances && createdInstances.length > 0) {
        const firstInstance =
          createdInstances.find((si) => si.started_at !== null) ??
          createdInstances[0];

        if (firstInstance) {
          await supabase
            .from("dossiers")
            .update({ current_step_instance_id: firstInstance.id })
            .eq("id", dossier.id);
        }
      }
    }

    // Create DOSSIER_CREATED event
    await supabase.from("events").insert({
      entity_type: "dossier",
      entity_id: dossier.id,
      event_type: "DOSSIER_CREATED",
      actor_type: "ADMIN",
      actor_id: adminUser.id,
      payload: {
        dossier_id: dossier.id,
        user_id: client_id,
        product_id,
        order_id: order.id,
        created_via: "manual_admin_creation",
      },
    });

    return NextResponse.json(
      { success: true, dossierId: dossier.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/dossiers/create]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
