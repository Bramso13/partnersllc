import { NextResponse } from "next/server";
import { getActiveProducts } from "@/lib/qualification";

export async function GET() {
  try {
    const products = await getActiveProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Error fetching products",
      },
      { status: 500 }
    );
  }
}
