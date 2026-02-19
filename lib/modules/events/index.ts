import { createClient, createAdminClient } from "@/lib/supabase/server";

export type EventType = "DOSSIER_CREATED" | "DOSSIER_STATUS_CHANGED" | "STEP_STARTED" | "STEP_COMPLETED" | "DOCUMENT_UPLOADED" | "DOCUMENT_REVIEWED" | "DOCUMENT_DELIVERED" | "PAYMENT_RECEIVED" | "PAYMENT_FAILED" | "MESSAGE_SENT" | "MANUAL_CLIENT_CREATED" | "ERROR";
export type ActorType = "USER" | "AGENT" | "SYSTEM";

export interface BaseEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: EventType;
  actor_type: ActorType | null;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export type TypedEvent = BaseEvent;

export async function getEventsByDossier(dossierId: string, useAdmin = false): Promise<BaseEvent[]> {
  const supabase = useAdmin ? createAdminClient() : await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("entity_type", "dossier").eq("entity_id", dossierId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as BaseEvent[];
}

export async function getEventsByUser(userId: string, useAdmin = false): Promise<BaseEvent[]> {
  const supabase = useAdmin ? createAdminClient() : await createClient();
  const { data: actorEvents } = await supabase.from("events").select("*").eq("actor_id", userId).order("created_at", { ascending: false });
  const { data: dossierEvents } = await supabase.from("events").select("*, dossiers!inner(user_id)").eq("entity_type", "dossier").eq("dossiers.user_id", userId).order("created_at", { ascending: false });
  const allEvents = [...(actorEvents || []), ...(dossierEvents || []).map((e: Record<string, unknown>) => {
    const { dossiers, ...event } = e;
    return event;
  })];
  const uniqueEvents = Array.from(new Map(allEvents.map((e) => [e.id, e])).values());
  uniqueEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return uniqueEvents as BaseEvent[];
}

export async function getEventsByType(eventType: EventType, useAdmin = false, limit?: number): Promise<BaseEvent[]> {
  const supabase = useAdmin ? createAdminClient() : await createClient();
  let query = supabase.from("events").select("*").eq("event_type", eventType).order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as BaseEvent[];
}

export async function getEventsByEntities(entityType: string, entityIds: string[], useAdmin = false): Promise<BaseEvent[]> {
  if (entityIds.length === 0) return [];
  const supabase = useAdmin ? createAdminClient() : await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("entity_type", entityType).in("entity_id", entityIds).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as BaseEvent[];
}

export async function getRecentEvents(limit = 50, useAdmin = false): Promise<BaseEvent[]> {
  const supabase = useAdmin ? createAdminClient() : await createClient();
  const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as BaseEvent[];
}
