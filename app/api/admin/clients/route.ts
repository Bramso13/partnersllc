import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getAllClients } from "@/lib/clients";

export async function GET() {
  try {
    console.log("🔍 [API /admin/clients] Starting...");
    await requireAdminAuth();
    console.log("✅ [API /admin/clients] Admin auth passed");

    const clients = await getAllClients();
    console.log("✅ [API /admin/clients] Returning", clients.length, "clients");
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error("❌ [API /admin/clients] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
