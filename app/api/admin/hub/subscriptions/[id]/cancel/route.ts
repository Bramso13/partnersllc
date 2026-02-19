import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "ID d'abonnement manquant" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("hub_subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) {
      console.error("[API POST /admin/hub/subscriptions/[id]/cancel]", error);
      return NextResponse.json(
        { error: "Échec de l'annulation de l'abonnement" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Abonnement introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, subscription: data });
  } catch (error) {
    console.error("[API POST /admin/hub/subscriptions/[id]/cancel]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
