import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Notification } from "./types";

// Re-export types for convenience
export type { Notification };

// =========================================================
// SERVER-SIDE QUERIES
// =========================================================

/**
 * Get unread notification count (server-side)
 */
export async function getUnreadNotificationCountServer(
  userId: string
): Promise<number> {
  const supabase = await createServerClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get recent notifications (server-side)
 */
export async function getRecentNotificationsServer(
  userId: string,
  limit: number = 10
): Promise<Notification[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent notifications:", error);
    return [];
  }

  return (data || []) as Notification[];
}
