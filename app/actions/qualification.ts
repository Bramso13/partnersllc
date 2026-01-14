"use server";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Create a dossier from a selected product
 */
export async function createDossierFromProduct(productId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify product exists and is active
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("active", true)
    .single();

  if (productError || !product) {
    throw new Error("Produit introuvable ou inactif");
  }

  // Check if user already has a qualification dossier for this product
  const { data: existingDossier } = await supabase
    .from("dossiers")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("status", "QUALIFICATION")
    .single();

  if (existingDossier) {
    // Dossier already exists, just return (page will reload and show workflow)
    return;
  }

  // Create new dossier
  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .insert({
      user_id: user.id,
      product_id: productId,
      type: product.dossier_type,
      status: "QUALIFICATION",
    })
    .select()
    .single();

  if (dossierError || !dossier) {
    console.error("Error creating dossier:", dossierError);
    throw new Error("Erreur lors de la création du dossier");
  }

  // Return success - page will reload and show workflow
  return;
}
