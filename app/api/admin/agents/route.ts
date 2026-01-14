import { requireAdminAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Require admin authentication
    await requireAdminAuth();

    const supabase = await createClient();

    // Fetch all active agents
    const { data: agents, error } = await supabase
      .from("agents")
      .select("id, name, email")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching agents:", error);
      return NextResponse.json(
        { error: "Failed to fetch agents" },
        { status: 500 }
      );
    }

    return NextResponse.json(agents || []);
  } catch (error) {
    console.error("Error in GET agents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
