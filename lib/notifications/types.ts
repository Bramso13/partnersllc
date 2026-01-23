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

// =========================================================
// NOTIFICATION RULES TYPES (Story 3.9)
// =========================================================

export type NotificationChannel = "EMAIL" | "WHATSAPP" | "IN_APP" | "SMS";

export interface NotificationRule {
  id: string;
  event_type: string; // EventType from lib/events.ts
  template_code: string;
  channels: NotificationChannel[];
  is_active: boolean;
  priority: number;
  conditions: Record<string, any> | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationRuleExecution {
  id: string;
  rule_id: string;
  event_id: string;
  notification_id: string | null;
  success: boolean;
  error_message: string | null;
  retry_count: number;
  executed_at: string;
}
