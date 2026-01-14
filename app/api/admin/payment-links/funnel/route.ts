import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    await requireAdminAuth();

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const dateStart = searchParams.get("date_start");
    const dateEnd = searchParams.get("date_end");

    // Build base query for payment links
    let baseQuery = supabase.from("payment_links").select("id, used_at");

    if (dateStart) {
      baseQuery = baseQuery.gte("created_at", dateStart);
    }
    if (dateEnd) {
      baseQuery = baseQuery.lte("created_at", dateEnd);
    }

    const { data: allLinks } = await baseQuery;
    const linkIds = allLinks?.map((l) => l.id) || [];

    // Total created
    const createdCount = allLinks?.length || 0;

    // Clicked (used_at is not null)
    const clickedCount =
      allLinks?.filter((l) => l.used_at !== null).length || 0;

    // Registered (has an order)
    let registeredCount = 0;
    let paidCount = 0;

    if (linkIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, payment_link_id, status")
        .in("payment_link_id", linkIds);

      registeredCount = new Set(orders?.map((o) => o.payment_link_id)).size;
      paidCount = orders?.filter((o) => o.status === "PAID").length || 0;
    }

    return NextResponse.json({
      funnel: {
        created_count: createdCount,
        clicked_count: clickedCount,
        registered_count: registeredCount,
        paid_count: paidCount,
      },
    });
  } catch (error) {
    console.error("Error in payment links funnel API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
