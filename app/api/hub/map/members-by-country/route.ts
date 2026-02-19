import { NextResponse } from "next/server";
import { getHubMemberOrNull } from "@/lib/hub/auth";
import { getMembersByCountry } from "@/lib/hub/members-by-country";

export const dynamic = "force-dynamic";

/**
 * GET /api/hub/map/members-by-country
 * Story 15.3: membres agrégés par pays (compteurs + liste id, display_name, profession).
 * Authentification Hub requise (token membre avec subscription active).
 */
export async function GET() {
  const user = await getHubMemberOrNull();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getMembersByCountry();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
