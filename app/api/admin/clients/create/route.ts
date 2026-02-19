import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createManualClient } from "@/lib/modules/clients";
import { z } from "zod";

const createManualClientSchema = z.object({
  full_name: z.string().min(1, "Le nom complet est obligatoire"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  product_id: z.string().uuid("Produit invalide"),
});

/**
 * POST /api/admin/clients/create
 * Create a client manually without payment flow
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth();

    const body = await request.json();

    const validation = createManualClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message },
        { status: 400 }
      );
    }

    const { full_name, email, phone, product_id } = validation.data;

    const result = await createManualClient(
      { full_name, email, phone, product_id },
      adminUser.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        userId: result.userId,
        dossierId: result.dossierId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/clients/create:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Une erreur est survenue",
      },
      { status: 500 }
    );
  }
}
