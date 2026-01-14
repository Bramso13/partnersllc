import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    await requireAdminAuth();

    const body = await request.json();
    const { link_ids } = body;

    if (!link_ids || !Array.isArray(link_ids) || link_ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid link IDs provided" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update selected links to EXPIRED status
    const { data, error } = await supabase
      .from("payment_links")
      .update({ status: "EXPIRED" })
      .in("id", link_ids)
      .eq("status", "ACTIVE") // Only expire ACTIVE links
      .select();

    if (error) {
      console.error("Error expiring payment links:", error);
      return NextResponse.json(
        { error: "Failed to expire payment links" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expired_count: data?.length || 0,
      message: `${data?.length || 0} payment link(s) expired successfully`,
    });
  } catch (error) {
    console.error("Error in bulk expire API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
