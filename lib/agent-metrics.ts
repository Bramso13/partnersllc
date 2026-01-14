import { createClient } from "@/lib/supabase/server";

export interface AgentStats {
  pendingReviews: number;
  assignedDossiers: number;
  completedToday: number;
  avgReviewTimeHours: number | null;
}

export interface ActivityEvent {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  dossier_id: string;
  dossier_number?: string;
}

export interface AgentDossier {
  id: string;
  dossier_number?: string;
  client_name: string;
  product_name: string | null;
  current_step_label: string | null;
  pending_documents_count: number;
  last_activity: string | null;
  has_unread_messages: boolean;
}

/**
 * Get agent statistics (pending reviews, assigned dossiers, etc.)
 */
export async function getAgentStats(agentId: string): Promise<AgentStats> {
  const supabase = await createClient();

  // Pending Reviews: Count of documents with status PENDING
  // Documents assigned to dossiers where the agent has step instances assigned
  // First, get dossier IDs where agent has step instances
  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("dossier_id")
    .eq("assigned_to", agentId);

  const dossierIds =
    stepInstances?.map((si) => si.dossier_id).filter(Boolean) || [];

  let pendingReviews = 0;
  if (dossierIds.length > 0) {
    const { count } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING")
      .in("dossier_id", dossierIds);
    pendingReviews = count || 0;
  }

  // Assigned Dossiers: Count of active dossiers with step instances assigned to agent
  const { count: assignedDossiers } = await supabase
    .from("step_instances")
    .select("dossier_id", { count: "exact", head: true })
    .eq("assigned_to", agentId)
    .is("completed_at", null);

  // Completed Today: Count of document reviews completed today by agent
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { count: completedToday } = await supabase
    .from("document_reviews")
    .select("*", { count: "exact", head: true })
    .eq("reviewer_id", agentId)
    .gte("reviewed_at", todayStart.toISOString())
    .lte("reviewed_at", todayEnd.toISOString());

  // Average Review Time: Average time between upload and review completion
  const { data: reviewTimes } = await supabase
    .from("document_reviews")
    .select(
      `
      reviewed_at,
      document_versions(uploaded_at)
    `
    )
    .eq("reviewer_id", agentId);

  let avgReviewTimeHours: number | null = null;
  if (reviewTimes && reviewTimes.length > 0) {
    const times = reviewTimes
      .map((rt: any) => {
        const docVersion = Array.isArray(rt.document_versions)
          ? rt.document_versions[0]
          : rt.document_versions;
        if (docVersion?.uploaded_at && rt.reviewed_at) {
          const uploadTime = new Date(docVersion.uploaded_at).getTime();
          const reviewTime = new Date(rt.reviewed_at).getTime();
          return (reviewTime - uploadTime) / (1000 * 60 * 60); // Convert to hours
        }
        return null;
      })
      .filter((t: number | null): t is number => t !== null);

    if (times.length > 0) {
      avgReviewTimeHours =
        times.reduce((sum, time) => sum + time, 0) / times.length;
    }
  }

  return {
    pendingReviews,
    assignedDossiers: assignedDossiers || 0,
    completedToday: completedToday || 0,
    avgReviewTimeHours: avgReviewTimeHours
      ? Math.round(avgReviewTimeHours * 10) / 10
      : null,
  };
}

/**
 * Get recent activity events for agent's dossiers
 */
export async function getAgentActivityEvents(
  agentId: string,
  limit: number = 20
): Promise<ActivityEvent[]> {
  const supabase = await createClient();

  // Get dossier IDs where agent has step instances assigned
  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("dossier_id")
    .eq("assigned_to", agentId);

  if (!stepInstances || stepInstances.length === 0) {
    return [];
  }

  const dossierIds = [...new Set(stepInstances.map((si) => si.dossier_id))];

  // Get events for these dossiers
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("entity_type", "dossier")
    .in("entity_id", dossierIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!events) {
    return [];
  }

  // Get dossier info for displaying dossier numbers
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, metadata")
    .in("id", dossierIds);

  const dossierMap = new Map(
    dossiers?.map((d) => [d.id, d.metadata?.dossier_number || d.id]) || []
  );

  // Format events with descriptions
  return events.map((event) => {
    const description = formatEventDescription(event);
    return {
      id: event.id,
      event_type: event.event_type,
      description,
      created_at: event.created_at,
      dossier_id: event.entity_id,
      dossier_number: dossierMap.get(event.entity_id),
    };
  });
}

/**
 * Format event description from event data
 */
function formatEventDescription(event: any): string {
  const payload = event.payload || {};
  const eventType = event.event_type;

  switch (eventType) {
    case "DOCUMENT_UPLOADED":
      return `${payload.client_name || "Client"} a uploadé ${payload.document_type || "un document"} pour le dossier ${payload.dossier_number || ""}`;
    case "DOCUMENT_REVIEWED":
      return `Révision de document terminée: ${payload.document_type || "Document"} (${payload.review_status === "APPROVED" ? "APPROUVÉ" : "REJETÉ"})`;
    case "DOSSIER_CREATED":
      return `Nouveau dossier créé: ${payload.client_name || ""}`;
    case "STEP_COMPLETED":
      return `Étape du workflow terminée: ${payload.step_name || ""}`;
    case "MESSAGE_SENT":
      return `Nouveau message de ${payload.sender_name || "client"}`;
    case "DOSSIER_STATUS_CHANGED":
      return `Statut du dossier modifié: ${payload.old_status || ""} → ${payload.new_status || ""}`;
    case "ASSIGNMENT_CHANGED":
      return `Dossier assigné à ${payload.agent_name || "un agent"}`;
    default:
      return `Événement: ${eventType}`;
  }
}

/**
 * Get dossiers assigned to agent
 */
export async function getAgentDossiers(
  agentId: string
): Promise<AgentDossier[]> {
  const supabase = await createClient();

  // Get step instances assigned to agent
  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("dossier_id")
    .eq("assigned_to", agentId)
    .is("completed_at", null);

  if (!stepInstances || stepInstances.length === 0) {
    return [];
  }

  // Get unique dossier IDs
  const dossierIds = [...new Set(stepInstances.map((si: any) => si.dossiers.id))];

  // Get dossier details
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, metadata, product_id, current_step_instance_id, user_id")
    .in("id", dossierIds);

  if (!dossiers || dossiers.length === 0) {
    return [];
  }

  // Get products
  const productIds = dossiers
    .map((d) => d.product_id)
    .filter(Boolean) as string[];
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .in("id", productIds);

  const productMap = new Map(products?.map((p) => [p.id, p.name]) || []);

  // Get profiles for client names
  const userIds = dossiers.map((d) => d.user_id).filter(Boolean) as string[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);


  // Get pending documents count for each dossier
  const { data: documents } = await supabase
    .from("documents")
    .select("dossier_id, status")
    .in("dossier_id", dossierIds)
    .eq("status", "PENDING");

  const pendingDocsMap = new Map<string, number>();
  documents?.forEach((doc) => {
    const count = pendingDocsMap.get(doc.dossier_id) || 0;
    pendingDocsMap.set(doc.dossier_id, count + 1);
  });

  // Get unread messages count
  const { data: messages } = await supabase
    .from("messages")
    .select("dossier_id, read_at")
    .in("dossier_id", dossierIds)
    .eq("sender_type", "USER")
    .is("read_at", null);

  const unreadMessagesMap = new Set(
    messages?.map((m) => m.dossier_id).filter(Boolean) || []
  );

  // Get last activity from events
  const { data: lastEvents } = await supabase
    .from("events")
    .select("entity_id, created_at")
    .eq("entity_type", "dossier")
    .in("entity_id", dossierIds)
    .order("created_at", { ascending: false });

  const lastActivityMap = new Map<string, string>();
  lastEvents?.forEach((event) => {
    if (!lastActivityMap.has(event.entity_id)) {
      lastActivityMap.set(event.entity_id, event.created_at);
    }
  });

  // Get current step labels
  const stepInstanceIds = dossiers
    .map((d) => d.current_step_instance_id)
    .filter(Boolean) as string[];

  const { data: currentSteps } = await supabase
    .from("step_instances")
    .select("id, step_id, steps(label)")
    .in("id", stepInstanceIds);

  const stepLabelMap = new Map<string, string>();
  currentSteps?.forEach((si: any) => {
    if (si.steps) {
      stepLabelMap.set(si.id, si.steps.label || "");
    }
  });

  // Format dossiers
  return dossiers.map((dossier) => ({
    id: dossier.id,
    dossier_number:
      (dossier.metadata as any)?.dossier_number || dossier.id.slice(0, 8),
    client_name: profileMap.get(dossier.user_id) || "Client inconnu",
    product_name: dossier.product_id ? productMap.get(dossier.product_id) || null : null,
    current_step_label: dossier.current_step_instance_id
      ? stepLabelMap.get(dossier.current_step_instance_id) || null
      : null,
    pending_documents_count: pendingDocsMap.get(dossier.id) || 0,
    last_activity: lastActivityMap.get(dossier.id) || null,
    has_unread_messages: unreadMessagesMap.has(dossier.id),
  }));
}

/**
 * Get document review data for performance chart (last 30 days)
 */
export async function getReviewChartData(
  agentId: string
): Promise<Array<{ date: string; count: number }>> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: reviews } = await supabase
    .from("document_reviews")
    .select("reviewed_at")
    .eq("reviewer_id", agentId)
    .gte("reviewed_at", thirtyDaysAgo.toISOString())
    .order("reviewed_at", { ascending: true });

  if (!reviews || reviews.length === 0) {
    return [];
  }

  // Group by date
  const dateMap = new Map<string, number>();
  reviews.forEach((review) => {
    const date = new Date(review.reviewed_at).toISOString().split("T")[0];
    const count = dateMap.get(date) || 0;
    dateMap.set(date, count + 1);
  });

  // Fill in missing dates with 0
  const result: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      count: dateMap.get(dateStr) || 0,
    });
  }

  return result;
}