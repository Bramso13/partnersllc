import { createClient } from "@/lib/supabase/server";
import { Product, ProductFormData } from "@/types/products";

/**
 * Fetch all products from database
 */
export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }

  return data as Product[];
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return data as Product;
}

/**
 * Check if a product has active dossiers
 */
export async function hasActiveDossiers(productId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("dossiers")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .in("status", ["QUALIFICATION", "IN_PROGRESS", "PENDING_REVIEW"]);

  if (error) {
    console.error("Error checking active dossiers:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Delete a product (only if no active dossiers)
 */
export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  // Check for active dossiers first
  const activeDossierCount = await hasActiveDossiers(productId);

  if (activeDossierCount > 0) {
    return {
      success: false,
      error: `Cannot delete product: ${activeDossierCount} active dossier(s) exist`,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: "Failed to delete product",
    };
  }

  return { success: true };
}

/**
 * Format price from cents to dollars
 */
export function formatPrice(cents: number, currency: string = "USD"): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(dollars);
}

/**
 * Convert price from dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Generate a unique product code from name
 */
export function generateProductCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);
}
