export type HubEventType = "online" | "irl" | "hybrid";
export type HubEventStatus = "draft" | "published" | "cancelled";
export type HubEventRegistrationStatus = "registered" | "waitlisted" | "cancelled";

export interface HubEvent {
  id: string;
  organizer_user_id: string;
  organizer_display_name: string | null;
  title: string;
  description: string | null;
  type: HubEventType;
  start_at: string;
  end_at: string | null;
  timezone: string;
  location_text: string | null;
  meet_url: string | null;
  max_attendees: number | null;
  attendee_count: number;
  status: HubEventStatus;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
  is_registered: boolean;
  registration_status: HubEventRegistrationStatus | null;
}

export interface HubEventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: HubEventRegistrationStatus;
  registered_at: string;
}

export interface EventsResponse {
  events: HubEvent[];
  total: number;
}

export interface RegisterResponse {
  registration: HubEventRegistration;
  waitlisted: boolean;
}
