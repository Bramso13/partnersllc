import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getClientDossiers } from "@/lib/clients";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();

    const { id } = await params;
    const dossiers = await getClientDossiers(id);
    return NextResponse.json(dossiers);
  } catch (error) {
    console.error("Error fetching client dossiers:", error);
    return NextResponse.json(
      { error: "Failed to fetch dossiers" },
      { status: 500 }
    );
  }
}
