import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema
const createManualClientSchema = z.object({
  full_name: z.string().min(1, "Le nom complet est obligatoire"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  product_id: z.string().uuid("Produit invalide"),
});

type CreateManualClientInput = z.infer<typeof createManualClientSchema>;

/**
 * POST /api/admin/clients/create
 * Create a client manually without payment flow
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin authentication
    const adminUser = await requireAdminAuth();
    const adminUserId = adminUser.id;

    // 2. Parse and validate request body
    const body: CreateManualClientInput = await request.json();

    const validation = createManualClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message },
        { status: 400 }
      );
    }

    const { full_name, email, phone, product_id } = validation.data;

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 3. Check if product exists and is active
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price_amount, currency, dossier_type, initial_status, active")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    if (!product.active) {
      return NextResponse.json(
        { error: "Produit non trouvé ou inactif" },
        { status: 400 }
      );
    }

    // 4. Check if email already exists in auth.users
    const { data: existingUsers, error: checkUserError } = await adminSupabase.auth.admin.listUsers();

    if (checkUserError) {
      console.error("Error checking existing users:", checkUserError);
      return NextResponse.json(
        { error: "Erreur lors de la vérification de l'email" },
        { status: 500 }
      );
    }

    const emailExists = existingUsers.users.some(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // 5. Create user in auth.users
    const { data: authData, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (createUserError || !authData.user) {
      console.error("Error creating user:", createUserError);
      return NextResponse.json(
        { error: "Erreur de création du compte" },
        { status: 500 }
      );
    }

    const newUserId = authData.user.id;

    try {
      // 6. Update profile created by trigger
      // Wait a moment for the trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { error: profileError } = await adminSupabase
        .from("profiles")
        .update({
          full_name,
          phone,
          status: "ACTIVE",
        })
        .eq("id", newUserId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw new Error("Erreur lors de la mise à jour du profil");
      }

      // 7. Create order (fictive, status PAID)
      const { data: order, error: orderError } = await adminSupabase
        .from("orders")
        .insert({
          user_id: newUserId,
          product_id: product_id,
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
        console.error("Error creating order:", orderError);
        throw new Error("Erreur lors de la création de la commande");
      }

      // 8. Create dossier
      const { data: dossier, error: dossierError } = await adminSupabase
        .from("dossiers")
        .insert({
          user_id: newUserId,
          product_id: product_id,
          type: product.dossier_type,
          status: product.initial_status || "QUALIFICATION",
          metadata: {
            order_id: order.id,
            created_via: "manual_admin_creation",
          },
        })
        .select()
        .single();

      if (dossierError || !dossier) {
        console.error("Error creating dossier:", dossierError);
        throw new Error("Erreur lors de la création du dossier");
      }

      // 9. Get product steps and create step instances
      const { data: productSteps, error: productStepsError } = await adminSupabase
        .from("product_steps")
        .select("step_id, position")
        .eq("product_id", product_id)
        .order("position", { ascending: true });

      if (productStepsError) {
        console.error("Error fetching product steps:", productStepsError);
        throw new Error("Erreur lors de la récupération des étapes");
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

        if (instancesError) {
          console.error("Error creating step instances:", instancesError);
          throw new Error("Erreur lors de la création des étapes");
        }

        // 10. Update dossier with current_step_instance_id
        if (createdInstances && createdInstances.length > 0) {
          const firstInstance =
            createdInstances.find((si) => si.started_at !== null) ||
            createdInstances[0];

          if (firstInstance) {
            await adminSupabase
              .from("dossiers")
              .update({
                current_step_instance_id: firstInstance.id,
              })
              .eq("id", dossier.id);
          }
        }
      }

      // 11. Link order to dossier
      await adminSupabase
        .from("orders")
        .update({
          dossier_id: dossier.id,
        })
        .eq("id", order.id);

      // 12. Create events

      // MANUAL_CLIENT_CREATED event
      const { error: manualClientCreatedError } = await adminSupabase.from("events").insert({
        entity_type: "profile",
        entity_id: newUserId,
        event_type: "MANUAL_CLIENT_CREATED",
        actor_type: "ADMIN",
        actor_id: adminUserId,
        payload: {
          user_id: newUserId,
          email: email,
          product_id: product_id,
        },
      }); 

      if (manualClientCreatedError) {
        console.error("Error creating manual client created event:", manualClientCreatedError);
        throw new Error("Erreur lors de la création de l'événement client manuel créé");
      }


      // DOSSIER_CREATED event
      const { error: dossierCreatedError } = await adminSupabase.from("events").insert({
        entity_type: "dossier",
        entity_id: dossier.id,
        event_type: "DOSSIER_CREATED",
        actor_type: "ADMIN",
        actor_id: adminUserId,
        payload: {
          dossier_id: dossier.id,
          user_id: newUserId,
          product_id: product_id,
          order_id: order.id,
          created_via: "manual_admin_creation",
        },
      });

      if (dossierCreatedError) {
        console.error("Error creating dossier created event:", dossierCreatedError);
        throw new Error("Erreur lors de la création de l'événement dossier créé");
      }

      // 13. Send invitation email
      // const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
      //   email,
      //   {
      //     redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
      //   }
      // );

      // if (inviteError) {
      //   console.error("Error sending invitation email:", inviteError);
      //   // Don't fail the entire operation if email fails
      //   // The user was created successfully
      // }

      // 14. Return success
      return NextResponse.json(
        {
          success: true,
          userId: newUserId,
          dossierId: dossier.id,
        },
        { status: 201 }
      );
    } catch (error) {
      // Rollback: Delete the created user if anything fails
      console.error("Error in client creation flow, attempting rollback:", error);

      try {
        await adminSupabase.auth.admin.deleteUser(newUserId);
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Une erreur est survenue",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/admin/clients/create:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Une erreur est survenue",
      },
      { status: 500 }
    );
  }
}
