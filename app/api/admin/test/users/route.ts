import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/test/users
 * Returns all users who have at least one dossier with is_test=true.
 */
export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createAdminClient();

    // Fetch test dossiers with client + product info
    const { data: testDossiers, error } = await supabase
      .from("dossiers")
      .select(
        `
        id,
        status,
        is_test,
        created_at,
        product_id,
        user_id,
        products(id, name),
        profiles!dossiers_user_id_fkey(id, full_name, phone)
      `
      )
      .eq("is_test", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/test/users] Query error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des utilisateurs de test" },
        { status: 500 }
      );
    }

    // Group by user
    const userMap = new Map<
      string,
      {
        userId: string;
        full_name: string | null;
        phone: string | null;
        dossiers: {
          id: string;
          status: string;
          created_at: string;
          product_name: string | null;
        }[];
      }
    >();

    for (const d of testDossiers ?? []) {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      const product = Array.isArray(d.products) ? d.products[0] : d.products;
      const userId = d.user_id;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          full_name: profile?.full_name ?? null,
          phone: profile?.phone ?? null,
          dossiers: [],
        });
      }

      userMap.get(userId)!.dossiers.push({
        id: d.id,
        status: d.status,
        created_at: d.created_at,
        product_name: product?.name ?? null,
      });
    }

    return NextResponse.json({ users: Array.from(userMap.values()) });
  } catch (error) {
    console.error("[GET /api/admin/test/users] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
