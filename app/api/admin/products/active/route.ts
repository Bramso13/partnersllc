import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/products/active
 * Fetch all active products for admin client creation
 */
export async function GET() {
  try {
    await requireAdminAuth();

    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price_amount, currency")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching active products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/products/active:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
