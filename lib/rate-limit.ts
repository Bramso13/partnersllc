/**
 * Simple in-memory rate limiter by key (e.g. IP).
 * For production at scale, use Redis or similar.
 */

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 15;

const store = new Map<string, { count: number; resetAt: number }>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export function checkRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  if (store.size > 10_000) cleanup();

  let entry = store.get(key);
  if (!entry) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1 };
  }
  if (entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1 };
  }
  entry.count += 1;
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { allowed, remaining };
}
