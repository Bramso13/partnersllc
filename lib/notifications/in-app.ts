import { createClient } from "@/lib/supabase/client";
import type { Notification, NotificationFilter } from "./types";

// Re-export types for convenience
export type { Notification, NotificationFilter };

// =========================================================
// CLIENT-SIDE QUERIES
// =========================================================

/**
 * Get unread notification count for current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get recent notifications for current user (last N)
 */
export async function getRecentNotifications(
  limit: number = 10
): Promise<Notification[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent notifications:", error);
    return [];
  }

  return (data || []) as Notification[];
}

/**
 * Get all notifications for current user with pagination
 */
export async function getNotifications(
  page: number = 1,
  pageSize: number = 50,
  filter: NotificationFilter = "all"
): Promise<{
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      notifications: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  // Apply filters
  switch (filter) {
    case "unread":
      query = query.is("read_at", null);
      break;
    case "document":
      query = query.or(
        "template_code.eq.DOCUMENT_APPROVED,template_code.eq.DOCUMENT_REJECTED,template_code.eq.DOCUMENT_UPLOADED"
      );
      break;
    case "payment":
      query = query.or(
        "template_code.eq.PAYMENT_RECEIVED,template_code.eq.PAYMENT_REMINDER"
      );
      break;
    case "message":
      query = query.eq("template_code", "MESSAGE_SENT");
      break;
    default:
      // "all" - no filter
      break;
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching notifications:", error);
    return {
      notifications: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    notifications: (data || []) as Notification[],
    total,
    page,
    pageSize,
    totalPages,
  };
}


// =========================================================
// MUTATIONS
// =========================================================

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id); // Security: only update own notifications

  if (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }

  return true;
}

// =========================================================
// FILTER HELPERS
// =========================================================

/**
 * Filter notifications by type
 */
export function filterNotificationsByType(
  notifications: Notification[],
  filter: NotificationFilter
): Notification[] {
  switch (filter) {
    case "unread":
      return notifications.filter((n) => !n.read_at);
    case "document":
      return notifications.filter((n) =>
        ["DOCUMENT_APPROVED", "DOCUMENT_REJECTED", "DOCUMENT_UPLOADED"].includes(
          n.template_code || ""
        )
      );
    case "payment":
      return notifications.filter((n) =>
        ["PAYMENT_RECEIVED", "PAYMENT_REMINDER"].includes(
          n.template_code || ""
        )
      );
    case "message":
      return notifications.filter((n) => n.template_code === "MESSAGE_SENT");
    default:
      return notifications;
  }
}

/**
 * Get notification icon based on template_code
 */
export function getNotificationIcon(templateCode: string | null): string {
  switch (templateCode) {
    case "DOCUMENT_APPROVED":
      return "fa-circle-check";
    case "DOCUMENT_REJECTED":
      return "fa-circle-xmark";
    case "DOCUMENT_UPLOADED":
      return "fa-file-upload";
    case "STEP_COMPLETED":
      return "fa-flag-checkered";
    case "PAYMENT_RECEIVED":
      return "fa-circle-dollar-to-slot";
    case "PAYMENT_REMINDER":
      return "fa-clock";
    case "MESSAGE_SENT":
      return "fa-message";
    case "WELCOME":
      return "fa-hand-wave";
    case "ADMIN_DOCUMENT_DELIVERED":
      return "fa-file-download";
    case "ADMIN_STEP_COMPLETED":
      return "fa-file-circle-check";
    default:
      return "fa-bell";
  }
}

/**
 * Get notification icon color based on template_code
 */
export function getNotificationIconColor(templateCode: string | null): string {
  switch (templateCode) {
    case "DOCUMENT_APPROVED":
    case "PAYMENT_RECEIVED":
      return "text-green-500";
    case "DOCUMENT_REJECTED":
      return "text-red-500";
    case "STEP_COMPLETED":
    case "MESSAGE_SENT":
    case "ADMIN_DOCUMENT_DELIVERED":
    case "ADMIN_STEP_COMPLETED":
      return "text-blue-500";
    case "PAYMENT_REMINDER":
      return "text-yellow-500";
    default:
      return "text-gray-500";
  }
}

/**
 * Get navigation URL for notification
 */
export function getNotificationUrl(notification: Notification): string {
  // Use action_url if available
  if (notification.action_url) {
    return notification.action_url;
  }

  // Fallback to dossier if available
  if (notification.dossier_id) {
    return `/dashboard/dossiers/${notification.dossier_id}`;
  }

  // Default to notifications page
  return "/dashboard/notifications";
}
