import { createAdminClient } from "@/lib/supabase/server";

export interface ClientProfile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  role: "CLIENT";
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWithDossierCount extends ClientProfile {
  dossiers_count: number;
}

export interface ClientFilters {
  search?: string;
  status?: "PENDING" | "ACTIVE" | "SUSPENDED";
  sortBy?: "full_name" | "email" | "status" | "dossiers_count" | "created_at";
  sortOrder?: "asc" | "desc";
}

export async function getAll(filters: ClientFilters = {}): Promise<ClientWithDossierCount[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("profiles")
    .select(`id, full_name, phone, status, role, stripe_customer_id, created_at, updated_at`)
    .eq("role", "CLIENT");

  if (filters.status) query = query.eq("status", filters.status);

  if (filters.search) {
    const search = `%${filters.search}%`;
    query = query.or(`full_name.ilike.${search},phone.ilike.${search}`);
  }

  const sortBy = filters.sortBy || "created_at";
  const sortOrder = filters.sortOrder || "desc";

  if (sortBy !== "dossiers_count") {
    query = query.order(sortBy, { ascending: sortOrder === "asc" });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: profiles, error: profilesError } = await query;
  if (profilesError) throw profilesError;
  if (!profiles) return [];

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const emailMap = new Map(authUsers?.users.map((u) => [u.id, u.email || ""]) || []);

  const clientIds = profiles.map((p) => p.id);
  const { data: dossierCounts } = await supabase
    .from("dossiers")
    .select("user_id")
    .in("user_id", clientIds);

  const countMap = new Map<string, number>();
  dossierCounts?.forEach((d) => {
    countMap.set(d.user_id, (countMap.get(d.user_id) || 0) + 1);
  });

  let clients: ClientWithDossierCount[] = profiles.map((profile) => ({
    ...profile,
    email: emailMap.get(profile.id) || "",
    role: "CLIENT" as const,
    dossiers_count: countMap.get(profile.id) || 0,
  }));

  if (sortBy === "dossiers_count") {
    clients = clients.sort((a, b) => {
      const order = sortOrder === "asc" ? 1 : -1;
      return (a.dossiers_count - b.dossiers_count) * order;
    });
  }

  return clients;
}

export async function getById(clientId: string): Promise<ClientProfile | null> {
  const supabase = createAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", clientId)
    .eq("role", "CLIENT")
    .single();

  if (error || !profile) return null;

  const { data: authUser } = await supabase.auth.admin.getUserById(clientId);
  return { ...profile, email: authUser?.user?.email || "", role: "CLIENT" };
}

export async function updateStatus(
  clientId: string,
  newStatus: "PENDING" | "ACTIVE" | "SUSPENDED",
  reason: string,
  adminId: string
): Promise<void> {
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("profiles")
    .select("status, full_name")
    .eq("id", clientId)
    .single();

  if (!client) throw new Error("Client not found");

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (updateError) throw updateError;

  await supabase.from("events").insert({
    entity_type: "profile",
    entity_id: clientId,
    event_type: "CLIENT_STATUS_CHANGED",
    description: `Statut changé de ${client.status} à ${newStatus}`,
    payload: { old_status: client.status, new_status: newStatus, reason, changed_by: adminId, client_name: client.full_name },
  });
}

export async function getEvents(clientId: string, limit: number = 10): Promise<Record<string, unknown>[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("entity_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getDossiers(clientId: string): Promise<Record<string, unknown>[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dossiers")
    .select(`id, status, created_at, product:products(name)`)
    .eq("user_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export const getAllClients = getAll;
export const getClientById = getById;
export const updateClientStatus = updateStatus;
export const getClientEvents = getEvents;
export const getClientDossiers = getDossiers;

export { createManualClient } from "./createManualClient";
