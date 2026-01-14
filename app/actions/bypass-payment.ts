"use server";

import { requireAuth } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Bypass payment for testing purposes
 * Activates the user account and creates dossier if needed
 */
export async function bypassPayment(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Require authentication
    const user = await requireAuth();
    
    // Verify the user is bypassing their own account
    if (user.id !== userId) {
      return { success: false, error: "Vous ne pouvez bypasser que votre propre compte" };
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Get user's profile
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id, status, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Profil utilisateur introuvable" };
    }

    // Get user's most recent order
    const { data: order } = await adminSupabase
      .from("orders")
      .select("id, product_id, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Update profile status to ACTIVE
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile status:", updateError);
      return { success: false, error: "Erreur lors de la mise à jour du profil" };
    }

    // Update order status to PAID if order exists
    if (order) {
      await adminSupabase
        .from("orders")
        .update({
          status: "PAID",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    }

    // Create dossier if it doesn't exist and we have a product_id
    if (order?.product_id) {
      const { data: existingDossier } = await adminSupabase
        .from("dossiers")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", order.product_id)
        .limit(1)
        .single();

      if (!existingDossier) {
        // Get product to determine dossier type
        const { data: product } = await adminSupabase
          .from("products")
          .select("id, dossier_type")
          .eq("id", order.product_id)
          .single();

        if (product) {
          // Create dossier
          const { data: dossier, error: dossierError } = await adminSupabase
            .from("dossiers")
            .insert({
              user_id: userId,
              product_id: order.product_id,
              type: product.dossier_type || "LLC",
              status: "QUALIFICATION",
              metadata: {
                order_id: order.id,
                created_via: "bypass_payment",
                bypassed_by: user.id,
              },
            })
            .select()
            .single();

          if (dossierError) {
            console.error("Error creating dossier:", dossierError);
            // Don't fail if dossier creation fails, user is already activated
          } else if (dossier) {
            // Get product steps and create step instances
            const { data: productSteps } = await adminSupabase
              .from("product_steps")
              .select("step_id, order_index")
              .eq("product_id", order.product_id)
              .order("order_index", { ascending: true });

            if (productSteps && productSteps.length > 0) {
              // Create step instances
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

              if (!instancesError && createdInstances && createdInstances.length > 0) {
                // Set current_step_instance_id to first step (the one with started_at)
                const firstInstance = createdInstances.find(
                  (si) => si.started_at !== null
                ) || createdInstances[0];

                if (firstInstance) {
                  await adminSupabase
                    .from("dossiers")
                    .update({
                      current_step_instance_id: firstInstance.id,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", dossier.id);

                  // Link dossier to order
                  await adminSupabase
                    .from("orders")
                    .update({
                      dossier_id: dossier.id,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", order.id);
                }
              }
            }
          }
        }
      }
    }

    // Create audit event
    await adminSupabase.from("events").insert({
      entity_type: "profile",
      entity_id: userId,
      event_type: "CLIENT_STATUS_CHANGED",
      actor_type: "USER",
      actor_id: user.id,
      description: `Statut changé de ${profile.status} à ACTIVE (bypass payment)`,
      payload: {
        old_status: profile.status,
        new_status: "ACTIVE",
        reason: "Bypass payment for testing",
        changed_by: user.id,
        client_name: profile.full_name,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error bypassing payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}
