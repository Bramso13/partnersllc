import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Product } from "@/types/products";

export async function getAll(): Promise<Product[]> {
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

export async function getById(id: string): Promise<Product | null> {
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

export async function deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  const activeDossierCount = await hasActiveDossiers(productId);
  if (activeDossierCount > 0) {
    return { success: false, error: `Cannot delete product: ${activeDossierCount} active dossier(s) exist` };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
  return { success: true };
}

export function formatPrice(cents: number, currency: string = "USD"): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(dollars);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function generateProductCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 50);
}

export const getProducts = getAll;
export const getProductById = getById;

export interface CreateProductInput {
  name: string;
  type: string;
  description?: string | null;
  stripe_product_id: string;
  stripe_price_id: string;
  price: number;
  active?: boolean;
  is_deposit?: boolean;
  full_product_id?: string | null;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const supabase = await createClient();

  const code = generateProductCode(input.name);

  const { data, error } = await supabase
    .from("products")
    .insert({
      code,
      name: input.name,
      description: input.description || null,
      dossier_type: input.type,
      stripe_product_id: input.stripe_product_id,
      stripe_price_id: input.stripe_price_id,
      price_amount: dollarsToCents(input.price),
      currency: "USD",
      active: input.active ?? true,
      is_deposit: input.is_deposit ?? false,
      full_product_id: input.is_deposit ? input.full_product_id : null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    throw error;
  }

  return data as Product;
}
