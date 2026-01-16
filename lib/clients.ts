import { createClient, createAdminClient } from "@/lib/supabase/server";

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

/**
 * Get all clients with dossier counts
 * Supports filtering, searching, and sorting
 */
export async function getAllClients(
  filters: ClientFilters = {}
): Promise<ClientWithDossierCount[]> {
  console.log("🔍 [getAllClients] Starting...");
  const supabase = createAdminClient();

  // Start query
  let query = supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      phone,
      status,
      role,
      stripe_customer_id,
      created_at,
      updated_at
    `
    )
    .eq("role", "CLIENT");

  console.log("🔍 [getAllClients] Querying profiles with role=CLIENT");

  // Apply status filter
  if (filters.status) {
    query = query.eq("status", filters.status);
    console.log("🔍 [getAllClients] Status filter:", filters.status);
  }

  // Apply search filter (name or phone)
  if (filters.search) {
    const search = `%${filters.search}%`;
    query = query.or(`full_name.ilike.${search},phone.ilike.${search}`);
    console.log("🔍 [getAllClients] Search filter:", filters.search);
  }

  // Apply sorting
  const sortBy = filters.sortBy || "created_at";
  const sortOrder = filters.sortOrder || "desc";

  if (sortBy !== "dossiers_count") {
    query = query.order(sortBy, { ascending: sortOrder === "asc" });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: profiles, error: profilesError } = await query;

  if (profilesError) {
    console.error("❌ [getAllClients] Error fetching profiles:", profilesError);
    throw profilesError;
  }

  console.log("✅ [getAllClients] Profiles fetched:", profiles?.length || 0);

  if (!profiles) {
    console.log("⚠️ [getAllClients] No profiles returned");
    return [];
  }

  console.log("🔍 [getAllClients] Sample profile:", profiles[0]);

  // Get emails from auth.users for each profile
  console.log("🔍 [getAllClients] Fetching auth users...");
  const { data: authUsers, error: authError } =
    await supabase.auth.admin.listUsers();

  if (authError) {
    console.error("❌ [getAllClients] Error fetching auth users:", authError);
  } else {
    console.log(
      "✅ [getAllClients] Auth users fetched:",
      authUsers?.users?.length || 0
    );
  }

  const emailMap = new Map(
    authUsers?.users.map((u) => [u.id, u.email || ""]) || []
  );

  console.log("🔍 [getAllClients] Email map size:", emailMap.size);

  // Get dossier counts for each client
  const clientIds = profiles.map((p) => p.id);
  console.log(
    "🔍 [getAllClients] Fetching dossiers for",
    clientIds.length,
    "clients"
  );

  const { data: dossierCounts, error: dossierError } = await supabase
    .from("dossiers")
    .select("user_id")
    .in("user_id", clientIds);

  if (dossierError) {
    console.error("❌ [getAllClients] Error fetching dossiers:", dossierError);
    throw dossierError;
  }

  console.log(
    "✅ [getAllClients] Dossier counts fetched:",
    dossierCounts?.length || 0
  );

  // Count dossiers per client
  const countMap = new Map<string, number>();
  dossierCounts?.forEach((d) => {
    countMap.set(d.user_id, (countMap.get(d.user_id) || 0) + 1);
  });

  // Combine data
  let clients: ClientWithDossierCount[] = profiles.map((profile) => ({
    ...profile,
    email: emailMap.get(profile.id) || "",
    role: "CLIENT" as const,
    dossiers_count: countMap.get(profile.id) || 0,
  }));

  console.log("✅ [getAllClients] Final clients count:", clients.length);
  console.log("🔍 [getAllClients] Sample client:", clients[0]);

  // Sort by dossiers_count if requested
  if (sortBy === "dossiers_count") {
    clients = clients.sort((a, b) => {
      const order = sortOrder === "asc" ? 1 : -1;
      return (a.dossiers_count - b.dossiers_count) * order;
    });
  }

  return clients;
}

/**
 * Get a single client by ID
 */
export async function getClientById(
  clientId: string
): Promise<ClientProfile | null> {
  // Use admin client to bypass RLS restrictions
  const supabase = createAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", clientId)
    .eq("role", "CLIENT")
    .single();

  if (error || !profile) {
    console.error("Error fetching client by ID:", error);
    return null;
  }

  // Get email from auth using admin client
  const { data: authUser } = await supabase.auth.admin.getUserById(clientId);

  return {
    ...profile,
    email: authUser?.user?.email || "",
    role: "CLIENT",
  };
}

/**
 * Update client status
 * Creates audit trail event
 */
export async function updateClientStatus(
  clientId: string,
  newStatus: "PENDING" | "ACTIVE" | "SUSPENDED",
  reason: string,
  adminId: string
): Promise<void> {
  const supabase = createAdminClient();

  // Get old status
  const { data: client } = await supabase
    .from("profiles")
    .select("status, full_name")
    .eq("id", clientId)
    .single();

  if (!client) {
    throw new Error("Client not found");
  }

  // Update status
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (updateError) throw updateError;

  // Create event for audit trail
  await supabase.from("events").insert({
    entity_type: "profile",
    entity_id: clientId,
    event_type: "CLIENT_STATUS_CHANGED",
    description: `Statut changé de ${client.status} à ${newStatus}`,
    payload: {
      old_status: client.status,
      new_status: newStatus,
      reason,
      changed_by: adminId,
      client_name: client.full_name,
    },
  });
}

/**
 * Get recent events for a client
 */
export async function getClientEvents(
  clientId: string,
  limit: number = 10
): Promise<any[]> {
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

/**
 * Get client's dossiers summary
 */
export async function getClientDossiers(clientId: string): Promise<any[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dossiers")
    .select(
      `
      id,
      status,
      created_at,
      product:products(name)
    `
    )
    .eq("user_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
