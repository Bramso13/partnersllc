import { NextRequest, NextResponse } from "next/server";
import { getProductSteps } from "@/lib/workflow";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("product_id");

    if (!productId) {
      return NextResponse.json(
        { message: "product_id is required" },
        { status: 400 }
      );
    }

    const steps = await getProductSteps(productId);
    return NextResponse.json(steps);
  } catch (error) {
    console.error("Error fetching product steps:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Error fetching product steps",
      },
      { status: 500 }
    );
  }
}
