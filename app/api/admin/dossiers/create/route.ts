import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createForExistingClient } from "@/lib/modules/dossiers/admin";
import { z } from "zod";

const CreateDossierForExistingClientSchema = z.object({
  client_id: z.string().uuid("client_id invalide"),
  product_id: z.string().uuid("product_id invalide"),
  initial_status: z
    .enum(["QUALIFICATION", "IN_PROGRESS", "PENDING"])
    .optional()
    .default("QUALIFICATION"),
});

/**
 * POST /api/admin/dossiers/create
 * Create a dossier for an existing client (without creating a new user).
 * Creates: order (PAID) + dossier + step_instances
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth();

    const body: unknown = await request.json();
    const validation = CreateDossierForExistingClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message },
        { status: 400 }
      );
    }

    const { client_id, product_id, initial_status } = validation.data;

    const result = await createForExistingClient({
      client_id,
      product_id,
      initial_status,
      created_by_admin: adminUser.id,
      created_via: "manual_admin_creation",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, dossierId: result.dossierId },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/dossiers/create]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
