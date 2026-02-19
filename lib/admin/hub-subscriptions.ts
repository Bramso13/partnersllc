import { createAdminClient } from "@/lib/supabase/server";

export type HubSubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "suspended";
export type HubSubscriptionPlan = "monthly" | "yearly";

export interface HubSubscriptionRow {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string;
  plan: HubSubscriptionPlan;
  status: HubSubscriptionStatus;
  started_at: string;
  expires_at: string;
  created_at: string;
  country: string | null;
  profession: string | null;
  is_llc_client: boolean;
}

/**
 * Récupère toutes les inscriptions Hub avec profils membres et email.
 * Utilise le client admin (bypass RLS).
 */
export async function getHubSubscriptions(): Promise<HubSubscriptionRow[]> {
  const supabase = createAdminClient();

  const { data: subs, error: subsError } = await supabase
    .from("hub_subscriptions")
    .select(
      `
      id,
      user_id,
      plan,
      status,
      started_at,
      expires_at,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (subsError) {
    console.error("[getHubSubscriptions] Error:", subsError);
    throw subsError;
  }

  if (!subs?.length) {
    return [];
  }

  const userIds = subs.map((s) => s.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("hub_member_profiles")
    .select("user_id, display_name, country, profession, is_llc_client")
    .in("user_id", userIds);

  if (profilesError) {
    console.error("[getHubSubscriptions] hub_member_profiles error:", profilesError);
  }

  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, p])
  );

  const { data: authData } = await supabase.auth.admin.listUsers();
  const emailMap = new Map(
    authData?.users?.map((u) => [u.id, u.email ?? ""]) ?? []
  );

  let rows: HubSubscriptionRow[] = subs.map((s) => {
    const mp = profileMap.get(s.user_id);
    return {
      id: s.id,
      user_id: s.user_id,
      display_name: mp?.display_name ?? null,
      email: emailMap.get(s.user_id) ?? "",
      plan: s.plan as HubSubscriptionPlan,
      status: s.status as HubSubscriptionStatus,
      started_at: s.started_at,
      expires_at: s.expires_at,
      created_at: s.created_at,
      country: mp?.country ?? null,
      profession: mp?.profession ?? null,
      is_llc_client: mp?.is_llc_client ?? false,
    };
  });

  return rows;
}
