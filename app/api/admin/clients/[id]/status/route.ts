import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { updateClientStatus } from "@/lib/clients";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { status, reason } = await request.json();

    if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    const { id } = await params;
    await updateClientStatus(id, status, reason, admin.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating client status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
