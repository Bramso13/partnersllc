import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    await requireAdminAuth();

    const supabase = await createClient();

    // Fetch all payment links with related data
    const { data: paymentLinks, error } = await supabase
      .from("payment_links")
      .select(
        `
        *,
        product:products(name),
        order:orders(id, status, amount, currency)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment links for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch payment links" },
        { status: 500 }
      );
    }

    // Generate CSV
    const headers = [
      "Token",
      "Email",
      "Product",
      "Created Date",
      "Expires Date",
      "Status",
      "Used Date",
      "Converted",
      "Order ID",
      "Payment Amount",
    ];

    const csvRows = [headers.join(",")];

    paymentLinks?.forEach((link) => {
      const converted =
        link.order && link.order.status === "PAID" ? "Yes" : "No";
      const orderAmount =
        link.order && link.order.status === "PAID"
          ? `${(link.order.amount / 100).toFixed(2)}`
          : "";

      const row = [
        link.token,
        link.prospect_email,
        link.product?.name || "",
        new Date(link.created_at).toISOString().split("T")[0],
        link.expires_at
          ? new Date(link.expires_at).toISOString().split("T")[0]
          : "",
        link.status,
        link.used_at
          ? new Date(link.used_at).toISOString().split("T")[0]
          : "",
        converted,
        link.order?.id || "",
        orderAmount,
      ];

      csvRows.push(row.map((cell) => `"${cell}"`).join(","));
    });

    const csvContent = csvRows.join("\n");
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `payment-links-export-${timestamp}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in export API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
