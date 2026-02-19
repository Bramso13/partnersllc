import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface HubMemberProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  country: string | null;
  profession: string | null;
  bio: string | null;
  is_llc_client: boolean;
}

/**
 * Vérifie que l'utilisateur est authentifié et a un abonnement Hub actif.
 * Retourne { user, profile } ou null si non authentifié ou pas membre Hub.
 * À utiliser dans les routes API /api/hub/* (ex. suggestions).
 */
export async function getHubMemberOrNull(): Promise<{
  user: User;
  profile: HubMemberProfile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: subscription } = await supabase
    .from("hub_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!subscription) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("hub_member_profiles")
    .select("id, user_id, display_name, country, profession, bio, is_llc_client")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    user,
    profile: profile as HubMemberProfile,
  };
}
