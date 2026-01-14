import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getAgentStats,
  getAgentActivityEvents,
  getAgentDossiers,
} from "@/lib/agent-metrics";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminAuth();

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId") || user.id;

    const [stats, activities, dossiers] = await Promise.all([
      getAgentStats(agentId),
      getAgentActivityEvents(agentId, 20),
      getAgentDossiers(agentId),
    ]);

    return NextResponse.json({
      stats,
      activities,
      dossiers,
    });
  } catch (error) {
    console.error("Error fetching agent dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}