import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getHubSubscriptions } from "@/lib/admin/hub-subscriptions";

export async function GET() {
  try {
    await requireAdminAuth();
    const subscriptions = await getHubSubscriptions();
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("[API GET /admin/hub/subscriptions]", error);
    return NextResponse.json(
      { error: "Échec de la récupération des inscriptions Hub" },
      { status: 500 }
    );
  }
}
