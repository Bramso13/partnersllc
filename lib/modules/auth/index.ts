import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, Session, UserProfile } from "@/types/auth";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getAgentId(email: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id")
    .eq("email", email)
    .single();
  if (agentError) {
    console.error("Error fetching agent:", agentError);
    return null;
  }
  return agent?.id || null;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, status, role, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return { ...profile, email: user.email || "" };
}

export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session as Session;
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requireAuth(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAuthWithProfile(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireClientAuth(): Promise<UserProfile> {
  const profile = await requireAuthWithProfile();
  if (profile.role !== "CLIENT") redirect("/unauthorized");
  return profile;
}

export async function requireAgentAuth(): Promise<UserProfile> {
  const profile = await requireAuthWithProfile();
  if (profile.role !== "AGENT" && profile.role !== "ADMIN") redirect("/unauthorized");
  return profile;
}

export async function requireAdminAuth(): Promise<UserProfile> {
  const profile = await requireAuthWithProfile();
  if (profile.role !== "ADMIN") redirect("/unauthorized");
  return profile;
}
