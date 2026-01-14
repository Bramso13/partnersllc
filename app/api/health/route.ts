import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Execute simple query to verify database connection
    // Using SELECT 1 equivalent: query any existing table with minimal data
    // This tests the connection without depending on specific table content
    const { error } = await supabase.from("products").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          database: "disconnected",
          error: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 503 }
    );
  }
}
