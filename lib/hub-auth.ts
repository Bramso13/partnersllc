/**
 * Auth spécifique Partners Hub : exige un utilisateur authentifié
 * avec un abonnement Hub actif (is_hub_member).
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

/**
 * Vérifie que l'utilisateur est authentifié et a un abonnement Hub actif.
 * Redirige vers /login si non authentifié, 403 si pas membre Hub.
 */
export async function requireHubAuth(): Promise<{ user: User; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: sub } = await supabase
    .from("hub_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!sub) {
    redirect("/hub/signup");
  }

  return { user, userId: user.id };
}

/**
 * Retourne l'utilisateur courant si authentifié et membre Hub, sinon null.
 * Utile pour les pages qui affichent un contenu différent selon le statut.
 */
export async function getHubUserIfMember(): Promise<{
  user: User;
  userId: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: sub } = await supabase
    .from("hub_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!sub) return null;

  return { user, userId: user.id };
}
