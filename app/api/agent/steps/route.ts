import { NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/auth";
import { getAgentStepQueue } from "@/lib/agent-steps";

export async function GET() {
  try {
    const agent = await requireAgentAuth();
    const steps = await getAgentStepQueue(agent.email, agent.full_name);
    return NextResponse.json({ steps });
  } catch (error) {
    console.error("[GET /api/agent/steps] Error", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la queue agent" },
      { status: 500 }
    );
  }
}


