import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

// =========================================================
// EVENT TYPES
// =========================================================

export type EventType =
  | "DOSSIER_CREATED"
  | "DOSSIER_STATUS_CHANGED"
  | "STEP_STARTED"
  | "STEP_COMPLETED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_REVIEWED"
  | "DOCUMENT_DELIVERED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "MESSAGE_SENT"
  | "ERROR";

export type ActorType = "USER" | "AGENT" | "SYSTEM";

export interface BaseEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: EventType;
  actor_type: ActorType | null;
  actor_id: string | null;
  payload: Record<string, any>;
  created_at: string;
}

// =========================================================
// EVENT PAYLOAD TYPES
// =========================================================

export interface DossierCreatedPayload {
  dossier_id: string;
  user_id: string;
  product_id: string;
  order_id?: string;
}

export interface DossierStatusChangedPayload {
  old_status: string;
  new_status: string;
  dossier_type: string;
  dossier_id: string;
}

export interface StepStartedPayload {
  step_id: string;
  step_instance_id: string;
  dossier_id: string;
}

export interface StepCompletedPayload {
  step_id: string;
  step_instance_id: string;
  dossier_id: string;
  completed_by?: string;
}

export interface DocumentUploadedPayload {
  version_id: string;
  version_number: number;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  dossier_id: string | null;
  uploaded_by_type: ActorType;
  uploaded_by_id: string;
  uploaded_at: string;
}

export interface DocumentReviewedPayload {
  document_id: string;
  document_version_id: string;
  document_type_id: string | null;
  document_type: string | null;
  dossier_id: string | null;
  reviewer_id: string;
  reviewer_name: string | null;
  review_status: "APPROVED" | "REJECTED";
  rejection_reason: string | null;
  notes: string | null;
  reviewed_at: string;
}

export interface PaymentReceivedPayload {
  order_id: string;
  amount_paid: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
}

export interface PaymentFailedPayload {
  order_id: string;
  reason?: string;
  stripe_session_id?: string;
}

export interface MessageSentPayload {
  message_id: string;
  dossier_id: string;
  sender_type: ActorType;
  sender_id: string;
  content: string;
}

export interface DocumentDeliveredPayload {
  dossier_id: string;
  document_ids: string[];
  document_count: number;
  step_instance_id?: string | null;
  step_name?: string | null;
  message?: string | null;
}

export interface ErrorPayload {
  error_type: string;
  error_message: string;
  context?: Record<string, any>;
}

// =========================================================
// TYPED EVENT INTERFACES
// =========================================================

export interface DossierCreatedEvent extends BaseEvent {
  event_type: "DOSSIER_CREATED";
  payload: DossierCreatedPayload;
}

export interface DossierStatusChangedEvent extends BaseEvent {
  event_type: "DOSSIER_STATUS_CHANGED";
  payload: DossierStatusChangedPayload;
}

export interface DocumentUploadedEvent extends BaseEvent {
  event_type: "DOCUMENT_UPLOADED";
  payload: DocumentUploadedPayload;
}

export interface DocumentReviewedEvent extends BaseEvent {
  event_type: "DOCUMENT_REVIEWED";
  payload: DocumentReviewedPayload;
}

export interface PaymentReceivedEvent extends BaseEvent {
  event_type: "PAYMENT_RECEIVED";
  payload: PaymentReceivedPayload;
}

export interface DocumentDeliveredEvent extends BaseEvent {
  event_type: "DOCUMENT_DELIVERED";
  payload: DocumentDeliveredPayload;
}

export type TypedEvent =
  | DossierCreatedEvent
  | DossierStatusChangedEvent
  | DocumentUploadedEvent
  | DocumentReviewedEvent
  | DocumentDeliveredEvent
  | PaymentReceivedEvent
  | BaseEvent;

// =========================================================
// EVENT QUERY UTILITIES
// =========================================================

/**
 * Get all events for a specific dossier
 */
export async function getEventsByDossier(
  dossierId: string,
  useAdmin: boolean = false
): Promise<BaseEvent[]> {
  const supabase = useAdmin ? createAdminClient() : await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("entity_type", "dossier")
    .eq("entity_id", dossierId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching events by dossier:", error);
    throw error;
  }

  return (data || []) as BaseEvent[];
}

/**
 * Get all events involving a specific user
 */
export async function getEventsByUser(
  userId: string,
  useAdmin: boolean = false
): Promise<BaseEvent[]> {
  const supabase = useAdmin ? createAdminClient() : await createClient();

  // Get events where user is the actor or where entity is a dossier owned by user
  const { data: actorEvents, error: actorError } = await supabase
    .from("events")
    .select("*")
    .eq("actor_id", userId)
    .order("created_at", { ascending: false });

  if (actorError) {
    console.error("Error fetching events by user (actor):", actorError);
    throw actorError;
  }

  // Get events for dossiers owned by user
  const { data: dossierEvents, error: dossierError } = await supabase
    .from("events")
    .select("*, dossiers!inner(user_id)")
    .eq("entity_type", "dossier")
    .eq("dossiers.user_id", userId)
    .order("created_at", { ascending: false });

  if (dossierError) {
    console.error("Error fetching events by user (dossier):", dossierError);
    throw dossierError;
  }

  // Combine and deduplicate
  const allEvents = [
    ...(actorEvents || []),
    ...(dossierEvents || []).map((e: any) => {
      const { dossiers, ...event } = e;
      return event;
    }),
  ];

  // Remove duplicates by id
  const uniqueEvents = Array.from(
    new Map(allEvents.map((e) => [e.id, e])).values()
  );

  // Sort by created_at descending
  uniqueEvents.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return uniqueEvents as BaseEvent[];
}

/**
 * Get all events of a specific type
 */
export async function getEventsByType(
  eventType: EventType,
  useAdmin: boolean = false,
  limit?: number
): Promise<BaseEvent[]> {
  const supabase = useAdmin ? createAdminClient() : await createClient();

  let query = supabase
    .from("events")
    .select("*")
    .eq("event_type", eventType)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching events by type:", error);
    throw error;
  }

  return (data || []) as BaseEvent[];
}

/**
 * Get events for multiple entities (e.g., multiple dossiers)
 */
export async function getEventsByEntities(
  entityType: string,
  entityIds: string[],
  useAdmin: boolean = false
): Promise<BaseEvent[]> {
  if (entityIds.length === 0) {
    return [];
  }

  const supabase = useAdmin ? createAdminClient() : await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching events by entities:", error);
    throw error;
  }

  return (data || []) as BaseEvent[];
}

/**
 * Get recent events (last N events)
 */
export async function getRecentEvents(
  limit: number = 50,
  useAdmin: boolean = false
): Promise<BaseEvent[]> {
  const supabase = useAdmin ? createAdminClient() : await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent events:", error);
    throw error;
  }

  return (data || []) as BaseEvent[];
}
