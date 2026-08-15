/**
 * Simple in-memory sliding window rate limiter.
 * Designed with an abstraction layer easily pluggable to Redis in production.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(key: string, limit = 10, windowSeconds = 60): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = { count: 1, resetAt: now + windowMs };
    memoryStore.set(key, newRecord);
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  memoryStore.set(key, record);

  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

// Cleanup expired keys periodically (unref'd to prevent keeping Vercel build worker event loop active)
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    const keys = Array.from(memoryStore.keys());

    for (const key of keys) {
      const rec = memoryStore.get(key);

      if (rec && now > rec.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 60000);

  if (
    cleanupTimer &&
    typeof cleanupTimer.unref === "function"
  ) {
    cleanupTimer.unref();
  }
}
