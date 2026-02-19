import { createAdminClient } from "@/lib/supabase/server";

export type HubSignupSessionRow = {
  id: string;
  account_type: string | null;
  email: string | null;
  is_llc_client: boolean;
  existing_user_id: string | null;
  expires_at: string;
  country: string | null;
  profession: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

const TABLE = "hub_signup_sessions";

export async function getSignupSession(
  signupSessionId: string
): Promise<HubSignupSessionRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", signupSessionId)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;
  return data as HubSignupSessionRow;
}

export async function updateSignupSessionStep3(
  signupSessionId: string,
  payload: { country: string; profession: string; bio: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from(TABLE)
    .update({
      country: payload.country,
      profession: payload.profession,
      bio: payload.bio ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", signupSessionId)
    .gt("expires_at", new Date().toISOString());

  if (error) return { success: false, error: error.message };
  return { success: true };
}
