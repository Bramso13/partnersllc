import { NextResponse } from "next/server";
import { requireClientAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/conversations
 * List the authenticated client's conversations (type='client', dossier owned by them).
 * Returns conversation summary with dossier label and last activity.
 */
export async function GET() {
  try {
    const profile = await requireClientAuth();
    const supabase = createAdminClient();

    // Fetch conversations linked to dossiers owned by this client
    const { data, error } = await supabase
      .from("twilio_conversations")
      .select(`
        id,
        dossier_id,
        created_at,
        dossiers!dossier_id (
          id,
          product_id,
          products!product_id (
            name
          )
        )
      `)
      .eq("type", "client")
      .in("dossier_id", (
        await supabase
          .from("dossiers")
          .select("id")
          .eq("user_id", profile.id)
      ).data?.map((d: { id: string }) => d.id) ?? [])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/conversations]", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    // Fetch last activity (most recent message) for each conversation
    const conversations = data ?? [];
    const summaries = await Promise.all(
      conversations.map(async (conv) => {
        const { data: lastMessage } = await supabase
          .from("twilio_conversation_messages")
          .select("created_at")
          .eq("twilio_conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Supabase returns dossiers as an array from the join; extract product name safely
        const dossier = Array.isArray(conv.dossiers) ? conv.dossiers[0] : conv.dossiers;
        const product = dossier ? (Array.isArray(dossier.products) ? dossier.products[0] : dossier.products) : null;

        return {
          id: conv.id,
          dossier_id: conv.dossier_id,
          dossier_label: product?.name ?? "Dossier",
          last_activity: lastMessage?.created_at ?? conv.created_at,
        };
      })
    );

    return NextResponse.json({ conversations: summaries });
  } catch (error) {
    console.error("[GET /api/conversations] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
