import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getProducts,
  deleteProduct,
  createProduct,
} from "@/lib/modules/products";
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

    // Validation : si is_deposit = true, full_product_id est requis
    if (body.is_deposit && !body.full_product_id) {
      return NextResponse.json(
        { error: "Un produit acompte doit être associé à un produit complet" },
        { status: 400 }
      );
    }

    // Create product
    const product = await createProduct({
      name: body.name,
      type: body.type,
      description: body.description,
      stripe_product_id: body.stripe_product_id,
      stripe_price_id: body.stripe_price_id,
      price: body.price,
      active: body.active,
      is_deposit: body.is_deposit,
      full_product_id: body.full_product_id,
    });

    return NextResponse.json({ product }, { status: 201 });
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
