import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/products";
import { ProductFormData } from "@/types/products";

/**
 * GET /api/admin/products/[id]
 * Fetch a single product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error("Error in GET /api/admin/products/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/products/[id]
 * Update a product
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const body: Partial<ProductFormData> = await request.json();

    const supabase = await createClient();

    // Build update object (excluding Stripe IDs which can't be changed)
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.description !== undefined) {
      updateData.description = body.description || null;
    }
    if (body.type !== undefined) {
      updateData.dossier_type = body.type;
    }
    if (body.price !== undefined) {
      if (body.price < 0.01) {
        return NextResponse.json(
          { error: "Price must be at least $0.01" },
          { status: 400 }
        );
      }
      updateData.price_amount = dollarsToCents(body.price);
    }
    if (body.active !== undefined) {
      updateData.active = body.active;
    }
    if (body.is_deposit !== undefined) {
      updateData.is_deposit = body.is_deposit;
      // Si on désactive is_deposit, on supprime aussi full_product_id
      if (!body.is_deposit) {
        updateData.full_product_id = null;
      }
    }
    if (body.full_product_id !== undefined) {
      // Validation : si is_deposit = true, full_product_id est requis
      if (body.is_deposit && !body.full_product_id) {
        return NextResponse.json(
          {
            error: "Un produit acompte doit être associé à un produit complet",
          },
          { status: 400 }
        );
      }
      updateData.full_product_id = body.full_product_id || null;
    }
    if (body.is_test !== undefined) {
      updateData.is_test = body.is_test;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error("Error in PATCH /api/admin/products/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
