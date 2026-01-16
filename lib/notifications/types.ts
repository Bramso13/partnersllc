// =========================================================
// NOTIFICATION TYPES
// =========================================================
// Shared types for both client and server-side code

export interface Notification {
  id: string;
  user_id: string;
  dossier_id: string | null;
  event_id: string | null;
  title: string;
  message: string;
  template_code: string | null;
  payload: Record<string, any>;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export type NotificationFilter =
  | "all"
  | "unread"
  | "document"
  | "payment"
  | "message";
