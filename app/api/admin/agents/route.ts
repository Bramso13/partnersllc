import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getAllWithProgress } from "@/lib/modules/agents/admin";

export async function GET() {
  await requireAdminAuth();

  try {
    const agentsWithProgress = await getAllWithProgress();

    return NextResponse.json({
      agents: agentsWithProgress,
    });
  } catch (error) {
    console.error("[GET /api/admin/agents] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
