import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/user";

/**
 * Get the user profile with status (server-side)
 * Returns null if profile not found
 */
export async function getProfile(
  userId: string
): Promise<(UserProfile & { role?: "CLIENT" | "AGENT" | "ADMIN" }) | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, status, role, stripe_customer_id, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile & { role?: "CLIENT" | "AGENT" | "ADMIN" };
}
