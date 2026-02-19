import { createAdminClient } from "@/lib/supabase/server";
import type { Dossier } from "@/types/dossiers";

export interface CreateDossierForClientInput {
  client_id: string;
  product_id: string;
  initial_status?: string;
  created_by_admin: string;
  created_via?: string;
}

export interface CreateDossierForClientResult {
  success: boolean;
  dossierId?: string;
  orderId?: string;
  error?: string;
}

export async function createForExistingClient(
  input: CreateDossierForClientInput
): Promise<CreateDossierForClientResult> {
  const supabase = createAdminClient();
  const { client_id, product_id, initial_status, created_by_admin, created_via } = input;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", client_id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Client introuvable" };
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, price_amount, currency, dossier_type, initial_status, active")
    .eq("id", product_id)
    .single();

  if (productError || !product) {
    return { success: false, error: "Produit introuvable" };
  }

  if (!product.active) {
    return { success: false, error: "Produit inactif" };
  }

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
    console.error("[createForExistingClient] Error creating order:", orderError);
    return { success: false, error: "Erreur lors de la création de la commande" };
  }

  const status = initial_status || product.initial_status || "QUALIFICATION";

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .insert({
      user_id: client_id,
      product_id,
      type: product.dossier_type,
      status,
      metadata: {
        order_id: order.id,
        created_via: created_via || "manual_admin_creation",
        created_by_admin,
      },
    })
    .select()
    .single();

  if (dossierError || !dossier) {
    console.error("[createForExistingClient] Error creating dossier:", dossierError);
    return { success: false, error: "Erreur lors de la création du dossier" };
  }

  await supabase
    .from("orders")
    .update({ dossier_id: dossier.id })
    .eq("id", order.id);

  const { data: productSteps, error: productStepsError } = await supabase
    .from("product_steps")
    .select("step_id, position")
    .eq("product_id", product_id)
    .order("position", { ascending: true });

  if (productStepsError) {
    console.error("[createForExistingClient] Error fetching product steps:", productStepsError);
    return { success: false, error: "Erreur lors de la récupération des étapes" };
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
      console.error("[createForExistingClient] Error creating step instances:", instancesError);
      return { success: false, error: "Erreur lors de la création des étapes" };
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

  await supabase.from("events").insert({
    entity_type: "dossier",
    entity_id: dossier.id,
    event_type: "DOSSIER_CREATED",
    actor_type: "ADMIN",
    actor_id: created_by_admin,
    payload: {
      dossier_id: dossier.id,
      user_id: client_id,
      product_id,
      order_id: order.id,
      created_via: created_via || "manual_admin_creation",
    },
  });

  return {
    success: true,
    dossierId: dossier.id,
    orderId: order.id,
  };
}
