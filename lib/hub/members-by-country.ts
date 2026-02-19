import { createAdminClient } from "@/lib/supabase/server";
import { hubMapCache, invalidateMembersByCountryCache } from "./cache";

export type MemberSummary = {
  id: string;
  display_name: string | null;
  profession: string | null;
};

export type CountryMembers = {
  country: string;
  count: number;
  members: MemberSummary[];
};

const CACHE_KEY = hubMapCache.keyMembersByCountry;
const CACHE_TTL_MS = hubMapCache.ttlSeconds * 1000;

/**
 * Retourne les membres Hub actifs agrégés par pays.
 * Utilise le cache 5 min (clé hub:map:members-by-country).
 * RLS : la fonction SQL get_hub_members_by_country est SECURITY DEFINER ;
 * n'appeler qu'après avoir vérifié que l'appelant est membre Hub.
 */
export async function getMembersByCountry(): Promise<CountryMembers[]> {
  const cached = hubMapCache.get<CountryMembers[]>(CACHE_KEY);
  if (cached) {
    return cached;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_hub_members_by_country");

  if (error) {
    throw new Error(`get_hub_members_by_country: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    country: string;
    member_count: number;
    members: MemberSummary[];
  }>;

  const result: CountryMembers[] = rows.map((row) => ({
    country: String(row.country ?? "").trim(),
    count: Number(row.member_count ?? 0),
    members: Array.isArray(row.members) ? row.members : [],
  }));

  hubMapCache.set(CACHE_KEY, result, CACHE_TTL_MS);
  return result;
}

export { invalidateMembersByCountryCache };
