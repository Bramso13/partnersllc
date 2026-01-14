import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    await requireAdminAuth();

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const statusFilter = searchParams.get("status")?.split(",") || [];
    const productFilter = searchParams.get("product_id")?.split(",") || [];
    const searchQuery = searchParams.get("search") || "";
    const dateStart = searchParams.get("date_start");
    const dateEnd = searchParams.get("date_end");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Build query
    let query = supabase
      .from("payment_links")
      .select(
        `
        *,
        product:products(id, name, code),
        created_by_agent:agents!payment_links_created_by_fkey(id, name, email),
        used_by_user:profiles!payment_links_used_by_fkey(id, full_name)
      `
      );

    // Apply filters
    if (statusFilter.length > 0) {
      query = query.in("status", statusFilter);
    }

    if (productFilter.length > 0) {
      query = query.in("product_id", productFilter);
    }

    if (searchQuery) {
      query = query.ilike("prospect_email", `%${searchQuery}%`);
    }

    if (dateStart) {
      query = query.gte("created_at", dateStart);
    }

    if (dateEnd) {
      query = query.lte("created_at", dateEnd);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const { data: paymentLinks, error } = await query;

    if (error) {
      console.error("Error fetching payment links:", error);
      return NextResponse.json(
        { error: "Failed to fetch payment links" },
        { status: 500 }
      );
    }

    // Fetch associated orders for conversion tracking
    const linkIds = paymentLinks?.map((pl) => pl.id) || [];
    let ordersData: any[] = [];

    if (linkIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, payment_link_id, status, amount, currency, paid_at")
        .in("payment_link_id", linkIds);

      ordersData = orders || [];
    }

    // Merge orders with payment links
    const paymentLinksWithOrders = paymentLinks?.map((link) => {
      const order = ordersData.find((o) => o.payment_link_id === link.id);
      return {
        ...link,
        order: order || null,
      };
    });

    return NextResponse.json({
      payment_links: paymentLinksWithOrders,
    });
  } catch (error) {
    console.error("Error in payment links API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
