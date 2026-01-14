import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/dossiers/[id]/advisor
 * Get advisor information for a dossier:
 * - First validated_by from step_instances
 * - Otherwise, first ADMIN from profiles
 * - Otherwise, first active agent from agents table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: dossierId } = await params;
    const supabase = await createClient();

    // Verify dossier ownership
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("id, user_id")
      .eq("id", dossierId)
      .eq("user_id", user.id)
      .single();

    if (dossierError || !dossier) {
      return NextResponse.json(
        { error: "Dossier introuvable" },
        { status: 404 }
      );
    }

    // 1. Try to get first validated_by from step_instances
    const { data: stepInstances } = await supabase
      .from("step_instances")
      .select("validated_by")
      .eq("dossier_id", dossierId)
      .not("validated_by", "is", null)
      .limit(1)
      .single();

    if (stepInstances?.validated_by) {
      // Get agent info
      const { data: agent } = await supabase
        .from("agents")
        .select("id, name, email")
        .eq("id", stepInstances.validated_by)
        .eq("active", true)
        .single();

      if (agent) {
        return NextResponse.json({
          id: agent.id,
          name: agent.name,
          email: agent.email,
          role: "Agent",
        });
      }
    }

    // 2. Try to get first ADMIN from profiles
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "ADMIN")
      .limit(1)
      .single();

    if (adminProfile) {
      // Get email from auth.users using admin client
      const adminSupabase = createAdminClient();
      const { data: authUser } = await adminSupabase.auth.admin.getUserById(
        adminProfile.id
      );

      return NextResponse.json({
        id: adminProfile.id,
        name: adminProfile.full_name || "Administrateur",
        email: authUser?.user?.email || "",
        role: "Administrateur",
      });
    }

    // 3. Fallback: get first active agent
    const { data: agent } = await supabase
      .from("agents")
      .select("id, name, email")
      .eq("active", true)
      .limit(1)
      .single();

    if (agent) {
      return NextResponse.json({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: "Agent",
      });
    }

    // Default fallback
    return NextResponse.json({
      id: null,
      name: "Sophie Martin",
      email: "",
      role: "Spécialiste LLC",
    });
  } catch (error) {
    console.error("Error fetching advisor:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du conseiller" },
      { status: 500 }
    );
  }
}
