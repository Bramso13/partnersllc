import { createAdminClient } from "@/lib/supabase/server";
import { createDossier } from "@/lib/dossiers";

export interface CreateManualClientInput {
  full_name: string;
  email: string;
  phone: string;
  product_id: string;
}

export interface CreateManualClientResult {
  success: boolean;
  userId?: string;
  dossierId?: string;
  error?: string;
}

export async function createManualClient(
  input: CreateManualClientInput,
  adminUserId: string
): Promise<CreateManualClientResult> {
  const { full_name, email, phone, product_id } = input;
  const adminSupabase = createAdminClient();

  const { data: product, error: productError } = await adminSupabase
    .from("products")
    .select(
      "id, name, price_amount, currency, dossier_type, initial_status, active"
    )
    .eq("id", product_id)
    .single();

  if (productError || !product) {
    return { success: false, error: "Produit non trouvé" };
  }

  if (!product.active) {
    return { success: false, error: "Produit non trouvé ou inactif" };
  }

  const { data: existingUsers, error: checkUserError } =
    await adminSupabase.auth.admin.listUsers();

  if (checkUserError) {
    console.error("Error checking existing users:", checkUserError);
    return {
      success: false,
      error: "Erreur lors de la vérification de l'email",
    };
  }

  const emailExists = existingUsers.users.some(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  if (emailExists) {
    return { success: false, error: "Cet email est déjà utilisé" };
  }

  const { data: authData, error: createUserError } =
    await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

  if (createUserError || !authData.user) {
    console.error("Error creating user:", createUserError);
    return { success: false, error: "Erreur de création du compte" };
  }

  const newUserId = authData.user.id;

  try {
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

    const { data: dossier, error: dossierError } = await createDossier(
      adminSupabase,
      {
        user_id: newUserId,
        product_id: product_id,
        type: product.dossier_type,
        status: product.initial_status || "QUALIFICATION",
        metadata: {
          order_id: order.id,
          created_via: "manual_admin_creation",
        },
      }
    );

    if (dossierError || !dossier) {
      console.error("Error creating dossier:", dossierError);
      throw new Error("Erreur lors de la création du dossier");
    }

    await adminSupabase
      .from("orders")
      .update({
        dossier_id: dossier.id,
      })
      .eq("id", order.id);

    let setPasswordUrl: string | null = null;
    try {
      const { data: linkData } = await adminSupabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password`,
        },
      });
      setPasswordUrl = linkData?.properties?.action_link ?? null;
    } catch (linkErr) {
      console.error("Error generating set-password link:", linkErr);
    }

    const { error: manualClientCreatedError } = await adminSupabase
      .from("events")
      .insert({
        entity_type: "profile",
        entity_id: newUserId,
        event_type: "MANUAL_CLIENT_CREATED",
        actor_type: "ADMIN",
        actor_id: adminUserId,
        payload: {
          user_id: newUserId,
          email: email,
          product_id: product_id,
          product_name: product.name,
          set_password_url: setPasswordUrl,
        },
      });

    if (manualClientCreatedError) {
      console.error(
        "Error creating manual client created event:",
        manualClientCreatedError
      );
      throw new Error(
        "Erreur lors de la création de l'événement client manuel créé"
      );
    }

    return {
      success: true,
      userId: newUserId,
      dossierId: dossier.id,
    };
  } catch (error) {
    try {
      await adminSupabase.auth.admin.deleteUser(newUserId);
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}
