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

    // Build base query with date filters
    let baseQuery = supabase.from("payment_links").select("*");

    if (dateStart) {
      baseQuery = baseQuery.gte("created_at", dateStart);
    }

    if (dateEnd) {
      baseQuery = baseQuery.lte("created_at", dateEnd);
    }

    // Total links created
    const { count: totalLinks } = await baseQuery;

    // Active links (not used, not expired)
    const { count: activeLinks } = await supabase
      .from("payment_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE");

    // Conversion rate calculation
    // Get all USED links
    let usedLinksQuery = supabase
      .from("payment_links")
      .select("id")
      .eq("status", "USED");

    if (dateStart) {
      usedLinksQuery = usedLinksQuery.gte("created_at", dateStart);
    }
    if (dateEnd) {
      usedLinksQuery = usedLinksQuery.lte("created_at", dateEnd);
    }

    const { data: usedLinks } = await usedLinksQuery;
    const totalUsedLinks = usedLinks?.length || 0;

    // Get orders for used links to check payment status
    let paidCount = 0;
    if (usedLinks && usedLinks.length > 0) {
      const linkIds = usedLinks.map((l) => l.id);
      const { data: paidOrders } = await supabase
        .from("orders")
        .select("id, payment_link_id")
        .in("payment_link_id", linkIds)
        .eq("status", "PAID");

      paidCount = paidOrders?.length || 0;
    }

    const conversionRate =
      totalUsedLinks > 0
        ? Math.round((paidCount / totalUsedLinks) * 100 * 100) / 100
        : 0;

    // Average time to conversion
    // Get payment links with paid orders
    let paidLinksQuery = supabase
      .from("payment_links")
      .select("created_at, orders!inner(paid_at)")
      .eq("orders.status", "PAID")
      .not("orders.paid_at", "is", null);

    if (dateStart) {
      paidLinksQuery = paidLinksQuery.gte("created_at", dateStart);
    }
    if (dateEnd) {
      paidLinksQuery = paidLinksQuery.lte("created_at", dateEnd);
    }

    const { data: paidLinksData } = await paidLinksQuery;

    let avgHours = 0;
    let avgDays = 0;

    if (paidLinksData && paidLinksData.length > 0) {
      const timeDiffs = paidLinksData
        .map((pl: any) => {
          const created = new Date(pl.created_at).getTime();
          const paid = new Date(pl.orders.paid_at).getTime();
          return paid - created;
        })
        .filter((diff) => diff > 0);

      if (timeDiffs.length > 0) {
        const avgMs =
          timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
        avgHours = avgMs / (1000 * 60 * 60);
        avgDays = avgMs / (1000 * 60 * 60 * 24);
      }
    }

    return NextResponse.json({
      analytics: {
        total_links: totalLinks || 0,
        active_links: activeLinks || 0,
        conversion_rate: conversionRate,
        avg_time_to_conversion_hours: Math.round(avgHours * 100) / 100,
        avg_time_to_conversion_days: Math.round(avgDays * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Error in payment links analytics API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
