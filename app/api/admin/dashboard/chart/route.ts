import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getReviewChartData } from "@/lib/agent-metrics";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminAuth();

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId") || user.id;

    const chartData = await getReviewChartData(agentId);

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}