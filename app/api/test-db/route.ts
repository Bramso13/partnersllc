import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test simple query to verify connection
    const { data, error } = await supabase
      .from("products")
      .select("id, code, name")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      data: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to database",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
