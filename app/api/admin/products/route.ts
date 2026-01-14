import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getProducts,
  deleteProduct,
  dollarsToCents,
  generateProductCode,
} from "@/lib/products";
import { ProductFormData } from "@/types/products";

/**
 * GET /api/admin/products
 * Fetch all products
 */
export async function GET() {
  try {
    await requireAdminAuth();

    const products = await getProducts();

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error in GET /api/admin/products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body: ProductFormData = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.type ||
      !body.stripe_product_id ||
      !body.stripe_price_id ||
      body.price === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate price
    if (body.price < 0.01) {
      return NextResponse.json(
        { error: "Price must be at least $0.01" },
        { status: 400 }
      );
    }

    // TODO: Validate Stripe IDs by calling Stripe API
    // For now, just basic format validation
    if (
      !body.stripe_product_id.startsWith("prod_") ||
      !body.stripe_price_id.startsWith("price_")
    ) {
      return NextResponse.json(
        { error: "Invalid Stripe ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate product code from name
    const code = generateProductCode(body.name);

    // Create product
    const { data, error } = await supabase
      .from("products")
      .insert({
        code,
        name: body.name,
        description: body.description || null,
        dossier_type: body.type,
        stripe_product_id: body.stripe_product_id,
        stripe_price_id: body.stripe_price_id,
        price_amount: dollarsToCents(body.price),
        currency: "USD",
        active: body.active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/products:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products
 * Delete a product (only if no active dossiers)
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteProduct(productId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/products:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
