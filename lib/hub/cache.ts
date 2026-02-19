/**
 * Cache pour les données Hub (map Story 15.3, suggestions Story 16.3).
 * En dev : cache mémoire avec TTL. En prod : brancher Redis pour invalidation multi-instance.
 */

const TTL_MAP_MS = 300_000; // 5 minutes (members-by-country)
const SUGGESTIONS_TTL_SEC = 3600; // 1 heure
const KEY_MEMBERS_BY_COUNTRY = "hub:map:members-by-country";

type CacheEntry<T> = { value: T; expiresAt: number };

const memoryStore = new Map<string, CacheEntry<unknown>>();

function getFromMemory<T>(key: string): T | null {
  const entry = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function setInMemory<T>(key: string, value: T, ttlMs: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

// --- Hub Map (Story 15.3) ---

export const hubMapCache = {
  keyMembersByCountry: KEY_MEMBERS_BY_COUNTRY,
  ttlSeconds: TTL_MAP_MS / 1000,

  get<T>(key: string): T | null {
    return getFromMemory(key) as T | null;
  },

  set<T>(key: string, value: T, ttlMs: number = TTL_MAP_MS): void {
    setInMemory(key, value, ttlMs);
  },

  del(key: string): void {
    memoryStore.delete(key);
  },
};

/**
 * Invalide le cache des membres par pays (AC 5).
 * À appeler après inscription d'un nouveau membre Hub.
 */
export function invalidateMembersByCountryCache(): void {
  hubMapCache.del(KEY_MEMBERS_BY_COUNTRY);
}

// --- Suggestions (Story 16.3) ---

/**
 * Récupère une valeur du cache. Retourne undefined si absente ou expirée.
 */
export function cacheGet<T>(key: string): T | undefined {
  const entry = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) memoryStore.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/**
 * Stocke une valeur dans le cache avec TTL en secondes.
 */
export function cacheSet<T>(key: string, value: T, ttlSec: number = SUGGESTIONS_TTL_SEC): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSec * 1000,
  });
}

/**
 * Invalide une clé (ex: à la mise à jour du profil).
 */
export function cacheDel(key: string): void {
  memoryStore.delete(key);
}

export const HUB_CACHE_KEYS = {
  suggestions: (userId: string) => `hub:suggestions:${userId}`,
} as const;
