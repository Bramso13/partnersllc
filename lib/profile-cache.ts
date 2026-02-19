/**
 * Cache TTL pour les profils Hub (Story 16.1).
 * Clé: hub:member:profile:{userId}, TTL 10 min.
 * En production, brancher Redis via REDIS_URL si disponible.
 */

const TTL_MS = 10 * 60 * 1000; // 10 min

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();

function get<T>(key: string): T | null {
  const entry = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function set<T>(key: string, value: T, ttlMs: number = TTL_MS): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function del(key: string): void {
  memoryStore.delete(key);
}

export const profileCache = {
  key: (userId: string) => `hub:member:profile:${userId}`,
  get,
  set,
  del,
  TTL_MS,
};
