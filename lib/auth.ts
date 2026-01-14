import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, Session, UserProfile } from "@/types/auth";

/**
 * Get the current authenticated user (server-side)
 * Returns null if not authenticated
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the current user's profile with role information
 * Returns null if not authenticated or profile not found
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, status, role, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    email: user.email || "",
  };
}

/**
 * Get the current session (server-side)
 * Returns null if no active session
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session as Session;
}

/**
 * Sign out the current user (server-side)
 * Redirects to login page after sign out
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use in Server Components or Server Actions
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Require authentication with profile - redirects to login if not authenticated
 * Returns user profile with role information
 */
export async function requireAuthWithProfile(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

/**
 * Require CLIENT role authentication
 * Redirects to /unauthorized if not a client
 */
export async function requireClientAuth(): Promise<UserProfile> {
  const profile = await requireAuthWithProfile();
  if (profile.role !== "CLIENT") {
    redirect("/unauthorized");
  }
  return profile;
}

/**
 * Require AGENT or ADMIN role authentication
 * Redirects to /unauthorized if not an agent or admin
 */
export async function requireAgentAuth(): Promise<UserProfile> {
  const profile = await requireAuthWithProfile();
  if (profile.role !== "AGENT" && profile.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  return profile;
}

/**
 * Require ADMIN role authentication
 * Redirects to /unauthorized if not an admin
 */
export async function requireAdminAuth(): Promise<UserProfile> {
  const profile = await requireAuthWithProfile();
  if (profile.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  return profile;
}
