import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

/**
 * Get user role from profiles table
 * Returns the role from profiles.role field
 * 
 * @deprecated This function is maintained for backward compatibility.
 * Prefer using getCurrentUserProfile() from @/lib/auth for new code.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return "CLIENT";
  }

  return data.role as UserRole;
}

/**
 * Check if user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "ADMIN";
}

/**
 * Check if user is an agent or admin
 */
export async function isAgentOrAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "AGENT" || role === "ADMIN";
}

/**
 * Check if user is a client
 */
export async function isClient(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "CLIENT";
}
