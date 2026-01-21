import { NextRequest, NextResponse } from "next/server";
import { getAgentId, requireAgentAuth } from "@/lib/auth";
import { getDossierAllData } from "@/lib/agent/dossiers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify agent authentication
    const agent = await requireAgentAuth();
    const agentId = await getAgentId(agent.email);
    if (!agentId) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    // Await params
    const { id } = await params;

    // Get all dossier data
    const data = await getDossierAllData(id, agentId);

    if (!data) {
      return NextResponse.json(
        { error: "Dossier not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching dossier all data:", error);

    if (error.message === "Agent does not have access to this dossier") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
