import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  calculateRevenueEncaisse,
  calculateRevenueSigne,
  calculateRevenueRestant,
} from "@/lib/admin/revenue-calculator";

/**
 * GET /api/admin/revenue
 * Récupère les métriques de revenus pour le dashboard admin
 */
export async function GET() {
  try {
    await requireAdminAuth();

    // Calculer les trois métriques en parallèle
    const [encaisse, signe, restant] = await Promise.all([
      calculateRevenueEncaisse(),
      calculateRevenueSigne(),
      calculateRevenueRestant(),
    ]);

    return NextResponse.json({
      encaisse,
      signe,
      restant,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/revenue:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue metrics" },
      { status: 500 }
    );
  }
}
