import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { AdvisorInfo } from "../shared";

export async function getAdvisor(dossierId: string): Promise<AdvisorInfo> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("validated_by")
    .eq("dossier_id", dossierId)
    .not("validated_by", "is", null)
    .limit(1)
    .single();

  if (stepInstances?.validated_by) {
    const { data: agent } = await supabase
      .from("agents")
      .select("id, name, email")
      .eq("id", stepInstances.validated_by)
      .eq("active", true)
      .single();

    if (agent) {
      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: "Agent",
      };
    }
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "ADMIN")
    .limit(1)
    .single();

  if (adminProfile) {
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(
      adminProfile.id
    );

    return {
      id: adminProfile.id,
      name: adminProfile.full_name || "Administrateur",
      email: authUser?.user?.email || "",
      role: "Administrateur",
    };
  }

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, email")
    .eq("active", true)
    .limit(1)
    .single();

  if (agent) {
    return {
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: "Agent",
    };
  }

  return {
    id: null,
    name: "Sophie Martin",
    email: "",
    role: "Spécialiste LLC",
  };
}
