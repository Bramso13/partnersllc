import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getAllClients } from "@/lib/clients";

export async function GET() {
  try {
    await requireAdminAuth();
    const clients = await getAllClients();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
