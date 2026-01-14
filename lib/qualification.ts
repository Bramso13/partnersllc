import { createClient } from "@/lib/supabase/server";
import { Product } from "@/types/qualification";

/**
 * Get all active products
 */
export async function getActiveProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  return (data as Product[]) || [];
}
