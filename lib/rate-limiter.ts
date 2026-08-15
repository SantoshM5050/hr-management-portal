export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export interface RateLimiterProvider {
  checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
}

// In-Memory Rate Limiter for Development & Single-Instance Deployments
class InMemoryRateLimiter implements RateLimiterProvider {
  private hits: Map<string, { count: number; resetAt: number }> = new Map();

  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowSeconds * 1000;
      this.hits.set(key, { count: 1, resetAt });
      return { allowed: true, limit, remaining: limit - 1, resetSeconds: windowSeconds };
    }

    if (entry.count >= limit) {
      const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, limit, remaining: 0, resetSeconds };
    }

    entry.count += 1;
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: true, limit, remaining: limit - entry.count, resetSeconds };
  }
}

// Redis Distributed Rate Limiter Contract for Multi-Instance Production
class RedisRateLimiter implements RateLimiterProvider {
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    // Contract placeholder for Redis INCR / EXPIRE integration
    return { allowed: true, limit, remaining: limit - 1, resetSeconds: windowSeconds };
  }
}

const providerType = process.env.RATE_LIMIT_PROVIDER || 'MEMORY';
export const rateLimiter: RateLimiterProvider =
  providerType === 'REDIS' ? new RedisRateLimiter() : new InMemoryRateLimiter();
